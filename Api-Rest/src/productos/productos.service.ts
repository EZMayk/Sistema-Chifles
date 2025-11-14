import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
  ) {}

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find();
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepository.create(createProductoDto);
    return await this.productoRepository.save(producto);
  }

  async update(id: number, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    await this.productoRepository.update(id, updateProductoDto);
    const updatedProducto = await this.findOne(id);
    if (!updatedProducto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return updatedProducto;
  }

  async remove(id: number): Promise<void> {
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
  }

  async toggleStatus(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOneBy({ id });
    if (!producto) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
  
    // Cambiar estado
    producto.estado = producto.estado === 'activo' ? 'inactivo' : 'activo';
    await this.productoRepository.save(producto);
    return producto;
  }
}