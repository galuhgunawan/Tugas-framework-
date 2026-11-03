import {
  Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany,
  OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { DecimalTransformer } from '../common/decimal.transformer';
import { OrderStatus } from '../common/enums';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Shipment } from './shipment.entity';

@Entity({ name: 'orders' })
@Check('"total_amount" >= 0')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (c) => c.orders, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'varchar', length: 30, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: DecimalTransformer,
  })
  totalAmount: number;

  // ---- Snapshot alamat pengiriman saat checkout ----
  @Column({ name: 'shipping_recipient_name', type: 'varchar', length: 150 })
  shippingRecipientName: string;

  @Column({ name: 'shipping_phone', type: 'varchar', length: 20 })
  shippingPhone: string;

  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  @Column({ name: 'shipping_city', type: 'varchar', length: 100 })
  shippingCity: string;

  @Column({ name: 'shipping_postal_code', type: 'varchar', length: 10 })
  shippingPostalCode: string;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: ['insert'] })
  items: OrderItem[];

  @OneToOne(() => Payment, (p) => p.order)
  payment: Payment;

  @OneToOne(() => Shipment, (s) => s.order)
  shipment: Shipment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
