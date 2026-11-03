import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateAddressDto, CreateCustomerDto, UpdateAddressDto, UpdateCustomerDto,
} from './dto/customer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post() create(@Body() dto: CreateCustomerDto) { return this.service.create(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }

  // ---- customer_addresses ----
  @Post(':customerId/addresses')
  addAddress(@Param('customerId', ParseUUIDPipe) customerId: string, @Body() dto: CreateAddressDto) {
    return this.service.addAddress(customerId, dto);
  }
  @Get(':customerId/addresses')
  listAddresses(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.listAddresses(customerId);
  }
  @Patch(':customerId/addresses/:addressId')
  updateAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.service.updateAddress(customerId, addressId, dto);
  }
  @Delete(':customerId/addresses/:addressId')
  removeAddress(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.service.removeAddress(customerId, addressId);
  }
}
