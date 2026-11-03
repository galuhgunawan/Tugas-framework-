import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { round2 } from '../common/decimal.transformer';
import { OrderStatus } from '../common/enums';
import { Book, CustomerAddress, Order, OrderItem } from '../entities';
import { CreateOrderDto } from './dto/order.dto';

/** Transisi status yang diperbolehkan. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  private generateOrderNumber() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${d}-${rnd}`;
  }

  /**
   * Checkout: semua langkah dalam SATU transaksi database agar atomik:
   * validasi alamat -> kunci baris buku -> cek stok -> hitung harga (snapshot)
   * -> simpan order & items -> kurangi stok.
   */
  async create(dto: CreateOrderDto) {
    const orderId = await this.dataSource.transaction(async (m) => {
      const address = await m.findOne(CustomerAddress, {
        where: { id: dto.addressId, customerId: dto.customerId },
      });
      if (!address) throw new BadRequestException('Alamat tidak ditemukan atau bukan milik customer ini');

      // Gabungkan item duplikat (buku yang sama)
      const qtyByBook = new Map<string, number>();
      for (const it of dto.items) qtyByBook.set(it.bookId, (qtyByBook.get(it.bookId) ?? 0) + it.quantity);

      const books = await m.find(Book, {
        where: { id: In([...qtyByBook.keys()]) },
        lock: { mode: 'pessimistic_write' }, // cegah oversell saat checkout bersamaan
      });
      if (books.length !== qtyByBook.size) throw new BadRequestException('Ada buku yang tidak ditemukan');

      const items: OrderItem[] = [];
      let total = 0;
      for (const book of books) {
        const qty = qtyByBook.get(book.id)!;
        if (!book.isAvailable) throw new BadRequestException(`Buku "${book.title}" tidak tersedia`);
        if (book.stock < qty)
          throw new BadRequestException(`Stok "${book.title}" tidak cukup (sisa ${book.stock}, diminta ${qty})`);

        const subtotal = round2(book.price * qty);
        total += subtotal;
        items.push(m.create(OrderItem, { bookId: book.id, quantity: qty, price: book.price, subtotal }));

        book.stock -= qty;
        if (book.stock === 0) book.isAvailable = false;
      }
      await m.save(books);

      const order = await m.save(
        m.create(Order, {
          customerId: dto.customerId,
          orderNumber: this.generateOrderNumber(),
          status: OrderStatus.PENDING,
          totalAmount: round2(total),
          shippingRecipientName: address.recipientName,
          shippingPhone: address.phone,
          shippingAddress: address.address,
          shippingCity: address.city,
          shippingPostalCode: address.postalCode,
          items,
        }),
      );
      return order.id;
    });
    return this.findOne(orderId);
  }

  findAll(customerId?: string) {
    return this.orders.find({
      where: customerId ? { customerId } : {},
      relations: { items: true, payment: true, shipment: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orders.findOne({
      where: { id },
      relations: { customer: true, items: { book: true }, payment: true, shipment: true },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  /** Dipakai juga oleh PaymentsService & ShipmentsService (dengan manager transaksi mereka). */
  async changeStatus(id: string, next: OrderStatus, manager?: EntityManager) {
    const run = async (m: EntityManager) => {
      const order = await m.findOne(Order, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException('Order tidak ditemukan');
      if (order.status === next) return order;
      if (!TRANSITIONS[order.status].includes(next))
        throw new ConflictException(`Transisi status ${order.status} -> ${next} tidak diperbolehkan`);

      if (next === OrderStatus.CANCELLED) await this.restock(m, id); // kembalikan stok
      order.status = next;
      return m.save(order);
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
  }

  private async restock(m: EntityManager, orderId: string) {
    const items = await m.find(OrderItem, { where: { orderId } });
    for (const it of items) {
      const book = await m.findOne(Book, { where: { id: it.bookId }, withDeleted: true });
      if (!book) continue;
      book.stock += it.quantity;
      book.isAvailable = true;
      await m.save(book);
    }
  }

  async updateStatus(id: string, next: OrderStatus) {
    await this.changeStatus(id, next);
    return this.findOne(id);
  }
}
