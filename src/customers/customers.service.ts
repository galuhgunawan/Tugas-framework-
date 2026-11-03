import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerAddress } from '../entities';
import {
  CreateAddressDto, CreateCustomerDto, UpdateAddressDto, UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(CustomerAddress) private readonly addresses: Repository<CustomerAddress>,
  ) {}

  create(dto: CreateCustomerDto) {
    return this.customers.save(this.customers.create(dto));
  }

  findAll() {
    return this.customers.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const row = await this.customers.findOne({ where: { id }, relations: { addresses: true } });
    if (!row) throw new NotFoundException('Customer tidak ditemukan');
    return row;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const row = await this.findOne(id);
    delete (row as Partial<Customer>).addresses;
    return this.customers.save(Object.assign(row, dto));
  }

  /** Soft delete (mengisi deleted_at) */
  async remove(id: string) {
    await this.findOne(id);
    await this.customers.softDelete(id);
    return { deleted: true };
  }

  // ---------- Addresses ----------
  async addAddress(customerId: string, dto: CreateAddressDto) {
    await this.findOne(customerId);
    return this.addresses.save(this.addresses.create({ ...dto, customerId }));
  }

  async listAddresses(customerId: string) {
    await this.findOne(customerId);
    return this.addresses.find({ where: { customerId }, order: { createdAt: 'ASC' } });
  }

  private async findAddress(customerId: string, addressId: string) {
    const row = await this.addresses.findOne({ where: { id: addressId, customerId } });
    if (!row) throw new NotFoundException('Alamat tidak ditemukan');
    return row;
  }

  async updateAddress(customerId: string, addressId: string, dto: UpdateAddressDto) {
    const row = await this.findAddress(customerId, addressId);
    return this.addresses.save(Object.assign(row, dto));
  }

  async removeAddress(customerId: string, addressId: string) {
    const row = await this.findAddress(customerId, addressId);
    await this.addresses.remove(row);
    return { deleted: true };
  }
}
