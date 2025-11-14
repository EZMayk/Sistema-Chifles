import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { Insumo } from './entities/insumo.entity';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Get()
  findAll(): Promise<Insumo[]> {
    return this.insumosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Insumo> {
    return this.insumosService.findOne(id);
  }

  @Post()
  async create(@Body() createInsumoDto: CreateInsumoDto): Promise<Insumo> {
    const nuevo= await this.insumosService.create(createInsumoDto);
    await notifyWebSocket('supply.restocked', nuevo);
    return nuevo;
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInsumoDto) {
    const actualizado = await this.insumosService.update(id, dto);
    await notifyWebSocket('supply.updated', actualizado);

    const STOCK_MINIMO_DEFAULT = 10; // valor arbitrario
    if (actualizado.stock < STOCK_MINIMO_DEFAULT) {
      await notifyWebSocket('supply.low', actualizado);
    } 
    return actualizado;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.insumosService.remove(id);
    await notifyWebSocket('supply.deleted', { id });
  }
}