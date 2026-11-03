import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { CategoryModule } from './categories/categories.module';
import { DbExceptionFilter } from './common/db-exception.filter';
import { CustomersModule } from './customers/customers.module';
import * as entities from './entities';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PublisherModule } from './publishers/publishers.module';
import { ShipmentsModule } from './shipments/shipments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('DB_PORT', '5432'), 10),
        username: cfg.get<string>('DB_USERNAME', 'postgres'),
        password: cfg.get<string>('DB_PASSWORD', 'postgres'),
        database: cfg.get<string>('DB_NAME', 'bookstore'),
        entities: Object.values(entities),
        synchronize: cfg.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: cfg.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    CustomersModule,
    CategoryModule,
    PublisherModule,
    AuthorModule,
    BooksModule,
    OrdersModule,
    PaymentsModule,
    ShipmentsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: DbExceptionFilter }],
})
export class AppModule {}
