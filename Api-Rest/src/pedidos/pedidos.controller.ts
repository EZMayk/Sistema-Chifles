import { Controller, Post, Body, Get, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';4
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  async create(@Body() dto: CreatePedidoDto) {
    const nuevo = await this.pedidosService.createWithDetalles(dto);
    await notifyWebSocket('order.created', nuevo);
    return nuevo;
  }

  @Get()
  findAll() {
    return this.pedidosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePedidoDto) {
    const actualizado = await this.pedidosService.update(id, dto);

    // Detectar estado y notificar acorde
    switch (actualizado.estado) {
      case 'en proceso':
        await notifyWebSocket('order.updated', actualizado);
        break;
      case 'listo':
        await notifyWebSocket('order.completed', actualizado);
        break;
      case 'cancelado':
        await notifyWebSocket('order.cancelled', actualizado);
        break;
    }

    return actualizado;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.remove(id);
  }
}
