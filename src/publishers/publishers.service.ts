import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publisher } from '../entities';
import { CreatePublisherDto, UpdatePublisherDto } from './dto/publisher.dto';

@Injectable()
export class PublisherService {
  constructor(@InjectRepository(Publisher) private readonly repo: Repository<Publisher>) {}

  create(dto: CreatePublisherDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Publisher tidak ditemukan');
    return row;
  }

  async update(id: string, dto: UpdatePublisherDto) {
    const row = await this.findOne(id);
    return this.repo.save(Object.assign(row, dto));
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { deleted: true };
  }
}
