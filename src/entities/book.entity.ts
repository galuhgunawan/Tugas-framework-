import {
  Check, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn,
  ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { DecimalTransformer } from '../common/decimal.transformer';
import { BookAuthor } from './book-author.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { Publisher } from './publisher.entity';

/**
 * Catatan: kolom `author` (varchar) DIHAPUS karena penulis dikelola lewat
 * tabel authors + book_authors (many-to-many). Menyimpan keduanya akan
 * menimbulkan redundansi & data tidak konsisten (sesuai catatan di studi kasus).
 */
@Entity({ name: 'books' })
@Check('"stock" >= 0')
@Check('"price" >= 0')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Diperbesar dari 30 -> 255 (studi kasus menyarankan, judul buku sering panjang)
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 45, unique: true })
  isbn: string;

  @Column({ type: 'int', default: 0 })
  publishedYear: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: DecimalTransformer })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Index()
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, (c) => c.books, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Index()
  @Column({ name: 'publisher_id', type: 'uuid', nullable: true })
  publisherId: string | null;

  @ManyToOne(() => Publisher, (p) => p.books, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'publisher_id' })
  publisher: Publisher | null;

  @OneToMany(() => BookAuthor, (ba) => ba.book)
  bookAuthors: BookAuthor[];

  @OneToMany(() => OrderItem, (oi) => oi.book)
  orderItems: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
