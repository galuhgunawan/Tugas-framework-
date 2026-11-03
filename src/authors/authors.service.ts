import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../entities';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Injectable()
export class AuthorService {
  constructor(@InjectRepository(Author) private readonly repo: Repository<Author>) {}

  create(dto: CreateAuthorDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Author tidak ditemukan');
    return row;
  }

  async update(id: string, dto: UpdateAuthorDto) {
    const row = await this.findOne(id);
    return this.repo.save(Object.assign(row, dto));
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { deleted: true };
  }
}
