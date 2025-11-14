import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll(): Promise<Producto[]> {
    return this.productosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Producto> {
    return this.productosService.findOne(id);
  }

  @Post()
  async create(@Body() createProductoDto: CreateProductoDto): Promise<Producto> {
    const nuevoProducto = await this.productosService.create(createProductoDto);
    await notifyWebSocket('product.created', nuevoProducto);
      return nuevoProducto;
  }
  

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const productoActualizado = await this.productosService.update(id, updateProductoDto);
    await notifyWebSocket('product.updated', productoActualizado);
    return productoActualizado;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productosService.remove(id);
    await notifyWebSocket('product.deleted', { id });
  }

  @Put(':id/estado')
  async toggleStatus(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const producto = await this.productosService.toggleStatus(id);
    const type = producto.estado === 'activo' ? 'product.enabled' : 'product.disabled';
    await notifyWebSocket(type, producto);
}
}