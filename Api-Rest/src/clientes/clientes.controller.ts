import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';

import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

import { notifyWebSocket } from '../utils/notify-ws';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateClienteDto) {
    const nuevoCliente = await this.clientesService.create(body);

    await notifyWebSocket("client.created", nuevoCliente);
    
    return nuevoCliente;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClienteDto,
  ) {
    const actualizado = await this.clientesService.update(id, body);

    await notifyWebSocket("client.updated", actualizado);

    return actualizado;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.clientesService.remove(id);

    await notifyWebSocket("client.deleted", { id });

    return { deleted: true };
  }
}
