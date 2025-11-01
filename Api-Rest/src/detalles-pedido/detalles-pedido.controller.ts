import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { DetallesPedidoService } from './detalles-pedido.service';
import { CreateDetalleDto } from './dto/create-detalles-pedido.dto';
import { UpdateDetallePedidoDto } from './dto/update-detalles-pedido.dto';
import { DetallePedido } from './entities/detalles-pedido.entity';

@Controller('detalles-pedido')
export class DetallesPedidoController {
  constructor(private readonly detallesPedidoService: DetallesPedidoService) {}

  @Get()
  findAll(): Promise<DetallePedido[]> {
    return this.detallesPedidoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DetallePedido> {
    return this.detallesPedidoService.findOne(id);
  }

  @Get('pedido/:pedidoId')
  findByPedido(@Param('pedidoId', ParseIntPipe) pedidoId: number): Promise<DetallePedido[]> {
    return this.detallesPedidoService.findByPedido(pedidoId);
  }

  @Post()
  create(@Body() createDetalleDto: CreateDetalleDto): Promise<DetallePedido> {
    return this.detallesPedidoService.create(createDetalleDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDetallePedidoDto: UpdateDetallePedidoDto,
  ): Promise<DetallePedido> {
    return this.detallesPedidoService.update(id, updateDetallePedidoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.detallesPedidoService.remove(id);
  }
}