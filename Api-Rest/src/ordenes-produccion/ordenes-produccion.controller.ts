import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { OrdenesProduccionService } from './ordenes-produccion.service';
import { CreateOrdenProduccionDto } from './dto/create-ordenes-produccion.dto';
import { UpdateOrdenProduccionDto } from './dto/update-ordenes-produccion.dto';
import { OrdenProduccion } from './entities/ordenes-produccion.entity';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('ordenes-produccion')
export class OrdenesProduccionController {
  constructor(private readonly ordenesProduccionService: OrdenesProduccionService) {}

  @Get()
  findAll(): Promise<OrdenProduccion[]> {
    return this.ordenesProduccionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrdenProduccion> {
    return this.ordenesProduccionService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateOrdenProduccionDto) {
    const nueva = await this.ordenesProduccionService.create(dto);
    await notifyWebSocket('production.started', nueva);
    return nueva;
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrdenProduccionDto) {
    const actualizada = await this.ordenesProduccionService.update(id, dto);

    switch (actualizada.estado) {
      case 'en_progreso':
        await notifyWebSocket('production.started', actualizada);
        break;
      case 'completada':
        await notifyWebSocket('production.completed', actualizada);
        break;
      case 'retrasada':
        await notifyWebSocket('production.delayed', actualizada);
        break;
      case 'cancelada':
        await notifyWebSocket('production.cancelled', actualizada);
        break;
    }

    return actualizada;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordenesProduccionService.remove(id);
  }
}