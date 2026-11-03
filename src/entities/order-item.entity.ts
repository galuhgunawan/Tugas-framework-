import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DecimalTransformer } from '../common/decimal.transformer';
import { Book } from './book.entity';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
@Check('"quantity" > 0')
@Check('"price" >= 0')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.items, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @ManyToOne(() => Book, (b) => b.orderItems, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ type: 'int' })
  quantity: number;

  /** Snapshot harga satuan saat transaksi (bukan harus sama dengan books.price sekarang). */
  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  subtotal: number;
}
