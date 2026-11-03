import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus, ShipmentStatus } from '../common/enums';
import { Order, Shipment } from '../entities';
import { OrdersService } from '../orders/orders.service';
import { CreateShipmentDto, UpdateShipmentStatusDto } from './dto/shipment.dto';

const FLOW: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PREPARING]: [ShipmentStatus.SHIPPED],
  [ShipmentStatus.SHIPPED]: [ShipmentStatus.DELIVERED],
  [ShipmentStatus.DELIVERED]: [],
};

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ordersService: OrdersService,
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
  ) {}

  /** Pengiriman hanya boleh dibuat untuk order yang sudah dibayar. Order -> processing. */
  async create(dto: CreateShipmentDto) {
    const id = await this.dataSource.transaction(async (m) => {
      const order = await m.findOne(Order, { where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('Order tidak ditemukan');
      if (order.status !== OrderStatus.PAID)
        throw new ConflictException(`Order berstatus "${order.status}"; pengiriman hanya untuk order "paid"`);
      if (await m.exists(Shipment, { where: { orderId: dto.orderId } }))
        throw new ConflictException('Order ini sudah memiliki data pengiriman');

      const shipment = await m.save(
        m.create(Shipment, {
          orderId: dto.orderId,
          courier: dto.courier,
          trackingNumber: dto.trackingNumber ?? null,
          status: ShipmentStatus.PREPARING,
        }),
      );
      await this.ordersService.changeStatus(dto.orderId, OrderStatus.PROCESSING, m);
      return shipment.id;
    });
    return this.findOne(id);
  }

  findAll() {
    return this.shipments.find({ relations: { order: true } });
  }

  async findOne(id: string) {
    const row = await this.shipments.findOne({ where: { id }, relations: { order: true } });
    if (!row) throw new NotFoundException('Shipment tidak ditemukan');
    return row;
  }

  /** shipped -> shipped_at + order "shipped"; delivered -> delivered_at + order "completed". */
  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    await this.dataSource.transaction(async (m) => {
      const shipment = await m.findOne(Shipment, { where: { id } });
      if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
      if (!FLOW[shipment.status].includes(dto.status))
        throw new ConflictException(`Transisi ${shipment.status} -> ${dto.status} tidak diperbolehkan`);

      shipment.status = dto.status;
      if (dto.trackingNumber) shipment.trackingNumber = dto.trackingNumber;

      if (dto.status === ShipmentStatus.SHIPPED) {
        shipment.shippedAt = new Date();
        await this.ordersService.changeStatus(shipment.orderId, OrderStatus.SHIPPED, m);
      } else if (dto.status === ShipmentStatus.DELIVERED) {
        shipment.deliveredAt = new Date();
        await this.ordersService.changeStatus(shipment.orderId, OrderStatus.COMPLETED, m);
      }
      await m.save(shipment);
    });
    return this.findOne(id);
  }
}
