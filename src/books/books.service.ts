import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Author, Book, BookAuthor, Category, Publisher } from '../entities';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Book) private readonly books: Repository<Book>,
  ) {}

  private readonly relations = {
    category: true,
    publisher: true,
    bookAuthors: { author: true },
  } as const;

  /** Ubah bookAuthors -> authors agar respons lebih rapi */
  private present(book: Book) {
    const { bookAuthors, ...rest } = book;
    return { ...rest, authors: (bookAuthors ?? []).map((ba) => ba.author) };
  }

  private async assertRefs(m: DataSource['manager'], dto: CreateBookDto | UpdateBookDto) {
    if (dto.categoryId && !(await m.exists(Category, { where: { id: dto.categoryId } })))
      throw new BadRequestException('categoryId tidak ditemukan');
    if (dto.publisherId && !(await m.exists(Publisher, { where: { id: dto.publisherId } })))
      throw new BadRequestException('publisherId tidak ditemukan');
    if (dto.authorIds?.length) {
      const found = await m.count(Author, { where: { id: In(dto.authorIds) } });
      if (found !== dto.authorIds.length) throw new BadRequestException('Ada authorIds yang tidak ditemukan');
    }
  }

  /** Aturan sinkronisasi: stok 0 => tidak tersedia. */
  private syncAvailability(book: Book) {
    if (book.stock <= 0) book.isAvailable = false;
  }

  async create(dto: CreateBookDto) {
    const id = await this.dataSource.transaction(async (m) => {
      await this.assertRefs(m, dto);
      const { authorIds, ...data } = dto;
      const book = m.create(Book, data);
      this.syncAvailability(book);
      const saved = await m.save(book);
      if (authorIds?.length) {
        await m.save(BookAuthor, authorIds.map((authorId) => m.create(BookAuthor, { bookId: saved.id, authorId })));
      }
      return saved.id;
    });
    return this.findOne(id);
  }

  async findAll(q: { search?: string; categoryId?: string; publisherId?: string }) {
    const qb = this.books.createQueryBuilder('b')
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.publisher', 'publisher')
      .leftJoinAndSelect('b.bookAuthors', 'ba')
      .leftJoinAndSelect('ba.author', 'author')
      .orderBy('b.createdAt', 'DESC');
    if (q.search) qb.andWhere('b.title ILIKE :s', { s: `%${q.search}%` });
    if (q.categoryId) qb.andWhere('b.category_id = :c', { c: q.categoryId });
    if (q.publisherId) qb.andWhere('b.publisher_id = :p', { p: q.publisherId });
    return (await qb.getMany()).map((b) => this.present(b));
  }

  async findOne(id: string) {
    const book = await this.books.findOne({ where: { id }, relations: this.relations });
    if (!book) throw new NotFoundException('Buku tidak ditemukan');
    return this.present(book);
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.dataSource.transaction(async (m) => {
      const book = await m.findOne(Book, { where: { id } });
      if (!book) throw new NotFoundException('Buku tidak ditemukan');
      await this.assertRefs(m, dto);
      const { authorIds, ...data } = dto;
      Object.assign(book, data);
      this.syncAvailability(book);
      await m.save(book);
      if (authorIds) {
        await m.delete(BookAuthor, { bookId: id });
        if (authorIds.length)
          await m.save(BookAuthor, authorIds.map((authorId) => m.create(BookAuthor, { bookId: id, authorId })));
      }
    });
    return this.findOne(id);
  }

  /** Soft delete */
  async remove(id: string) {
    await this.findOne(id);
    await this.books.softDelete(id);
    return { deleted: true };
  }
}
