import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { ProductosInsumosService } from './productos-insumos.service';
import { CreateProductoInsumoDto } from './dto/create-productos-insumo.dto';
import { UpdateProductoInsumoDto } from './dto/update-productos-insumo.dto';
import { ProductoInsumo } from './entities/productos-insumo.entity';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('productos-insumos')
export class ProductosInsumosController {
  constructor(private readonly productosInsumosService: ProductosInsumosService) {}

  @Get()
  findAll(): Promise<ProductoInsumo[]> {
    return this.productosInsumosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductoInsumo> {
    return this.productosInsumosService.findOne(id);
  }

  @Get('producto/:productoId')
  findByProducto(@Param('productoId', ParseIntPipe) productoId: number): Promise<ProductoInsumo[]> {
    return this.productosInsumosService.findByProducto(productoId);
  }

  @Get('insumo/:insumoId')
  findByInsumo(@Param('insumoId', ParseIntPipe) insumoId: number): Promise<ProductoInsumo[]> {
    return this.productosInsumosService.findByInsumo(insumoId);
  }

  @Post()
  async create(@Body() createProductoInsumoDto: CreateProductoInsumoDto): Promise<ProductoInsumo> {
    const nuevo = await this.productosInsumosService.create(createProductoInsumoDto);
    await notifyWebSocket('recipe.created', nuevo);
    return nuevo;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoInsumoDto: UpdateProductoInsumoDto,
  ): Promise<ProductoInsumo> {
    const actualizado = await this.productosInsumosService.update(id, updateProductoInsumoDto);
    await notifyWebSocket('recipe.updated', actualizado);
    return actualizado;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productosInsumosService.remove(id);
    await notifyWebSocket('recipe.deleted', { id });
  }
}