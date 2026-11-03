import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus, PaymentStatus } from '../common/enums';
import { Order, Payment } from '../entities';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ordersService: OrdersService,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  /** amount otomatis = orders.total_amount (tidak dipercaya dari client). */
  async create(dto: CreatePaymentDto) {
    const order = await this.dataSource.manager.findOne(Order, { where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.status !== OrderStatus.PENDING)
      throw new ConflictException(`Order berstatus "${order.status}", tidak bisa dibayar`);
    if (await this.payments.exists({ where: { orderId: dto.orderId } }))
      throw new ConflictException('Order ini sudah memiliki catatan pembayaran');

    return this.payments.save(
      this.payments.create({
        orderId: order.id,
        paymentMethod: dto.paymentMethod,
        amount: order.totalAmount,
        status: PaymentStatus.PENDING,
      }),
    );
  }

  findAll() {
    return this.payments.find({ relations: { order: true }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const row = await this.payments.findOne({ where: { id }, relations: { order: true } });
    if (!row) throw new NotFoundException('Payment tidak ditemukan');
    return row;
  }

  /** paid -> isi paid_at + order jadi "paid". failed -> order tetap pending. */
  async updateStatus(id: string, status: PaymentStatus) {
    await this.dataSource.transaction(async (m) => {
      const payment = await m.findOne(Payment, { where: { id } });
      if (!payment) throw new NotFoundException('Payment tidak ditemukan');
      if (payment.status === PaymentStatus.PAID && status !== PaymentStatus.PAID)
        throw new ConflictException('Pembayaran yang sudah paid tidak dapat diubah');

      payment.status = status;
      payment.paidAt = status === PaymentStatus.PAID ? (payment.paidAt ?? new Date()) : null;
      await m.save(payment);

      if (status === PaymentStatus.PAID) {
        await this.ordersService.changeStatus(payment.orderId, OrderStatus.PAID, m);
      }
    });
    return this.findOne(id);
  }
}
