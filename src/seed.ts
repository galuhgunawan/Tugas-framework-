import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Author, Book, BookAuthor, Category, Customer, CustomerAddress, Publisher } from './entities';

/** Mengisi data contoh. Jalankan: npm run seed (aman dijalankan ulang). */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const ds = app.get(DataSource);
  const m = ds.manager;

  if ((await m.count(Book)) > 0) {
    console.log('Data sudah ada, seed dilewati.');
    return app.close();
  }

  const cats = await m.save(Category, ['Programming', 'Database', 'Business', 'Design', 'Education']
    .map((name) => m.create(Category, { name })));
  const [pub1, pub2] = await m.save(Publisher, [
    m.create(Publisher, { name: 'Prentice Hall' }),
    m.create(Publisher, { name: "O'Reilly Media" }),
  ]);
  const [a1, a2, a3] = await m.save(Author, [
    m.create(Author, { name: 'Robert C. Martin' }),
    m.create(Author, { name: 'Martin Kleppmann' }),
    m.create(Author, { name: 'Andrew Hunt' }),
  ]);

  const b1 = await m.save(m.create(Book, {
    title: 'Clean Code', isbn: '9780132350884', publishedYear: 2008, price: 150000, stock: 20,
    categoryId: cats[0].id, publisherId: pub1.id,
  }));
  const b2 = await m.save(m.create(Book, {
    title: 'Designing Data-Intensive Applications', isbn: '9781449373320', publishedYear: 2017,
    price: 350000, stock: 10, categoryId: cats[1].id, publisherId: pub2.id,
  }));
  const b3 = await m.save(m.create(Book, {
    title: 'The Pragmatic Programmer', isbn: '9780135957059', publishedYear: 2019, price: 275000,
    stock: 15, categoryId: cats[0].id, publisherId: pub1.id,
  }));
  await m.save(BookAuthor, [
    m.create(BookAuthor, { bookId: b1.id, authorId: a1.id }),
    m.create(BookAuthor, { bookId: b2.id, authorId: a2.id }),
    m.create(BookAuthor, { bookId: b3.id, authorId: a3.id }),
  ]);

  const cust = await m.save(m.create(Customer, { name: 'Budi Santoso', email: 'budi@mail.com', phone: '081234567890' }));
  await m.save(m.create(CustomerAddress, {
    customerId: cust.id, recipientName: 'Budi Santoso', phone: '081234567890',
    address: 'Jl. Merdeka No. 10', city: 'Pekalongan', postalCode: '51111',
  }));

  console.log('Seed selesai: 5 kategori, 2 penerbit, 3 penulis, 3 buku, 1 customer + 1 alamat.');
  await app.close();
}
seed();
