import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdenProduccion } from './entities/ordenes-produccion.entity';
import { CreateOrdenProduccionDto } from './dto/create-ordenes-produccion.dto';
import { UpdateOrdenProduccionDto } from './dto/update-ordenes-produccion.dto';
import { ProductoInsumo } from '../productos-insumos/entities/productos-insumo.entity';
import { DetalleOrdenProduccion } from '../detalles-orden-produccion/entities/detalles-orden-produccion.entity';

@Injectable()
export class OrdenesProduccionService {
  constructor(
    @InjectRepository(OrdenProduccion)
    private ordenProduccionRepository: Repository<OrdenProduccion>,
  ) {}

  async findAll(): Promise<OrdenProduccion[]> {
    return this.ordenProduccionRepository.find({
      relations: ['producto', 'detalles'],
    });
  }

  async findOne(id: number): Promise<OrdenProduccion> {
    const orden = await this.ordenProduccionRepository.findOne({
      where: { id },
      relations: ['producto', 'detalles'],
    });
    if (!orden) {
      throw new NotFoundException(`Orden de producción con ID ${id} no encontrada`);
    }
    return orden;
  }

  async create(createOrdenProduccionDto: CreateOrdenProduccionDto): Promise<OrdenProduccion> {
    // Crear la orden y sus detalles de orden de producción automáticamente
    // en una transacción para asegurar consistencia.
    return await this.ordenProduccionRepository.manager.transaction(async (manager) => {
      // Repositorios tipados dentro de la transacción
      const ordenRepo = manager.getRepository<OrdenProduccion>(OrdenProduccion);
      const productoInsumoRepo = manager.getRepository<ProductoInsumo>(ProductoInsumo);
      const detalleRepo = manager.getRepository<DetalleOrdenProduccion>(DetalleOrdenProduccion);

      // 1) Crear y guardar la orden
      const orden = ordenRepo.create(createOrdenProduccionDto as Partial<OrdenProduccion>);
      const savedOrden = await ordenRepo.save(orden);

      // 2) Cargar los insumos necesarios para el producto
      const productosInsumos = await productoInsumoRepo.find({
        where: { productoId: createOrdenProduccionDto.productoId },
      });

      // 3) Crear detalles de orden de producción basados en la cantidad a producir
      const cantidadAProducir = Number(createOrdenProduccionDto.cantidad_producir) || 0;
      const detallesToSave = productosInsumos.map((pi) => {
        return detalleRepo.create({
          ordenProduccionId: savedOrden.id,
          insumoId: pi.insumoId,
          // cantidad_utilizada = cantidad_necesaria * cantidad_producir
          cantidad_utilizada: Number(pi.cantidad_necesaria) * cantidadAProducir,
        });
      });

      if (detallesToSave.length > 0) {
        await detalleRepo.save(detallesToSave);
      }

      // 4) Devolver la orden con relaciones cargadas
      return await ordenRepo.findOneOrFail({ where: { id: savedOrden.id }, relations: ['producto', 'detalles'] });
    });
  }

  async update(id: number, updateOrdenProduccionDto: UpdateOrdenProduccionDto): Promise<OrdenProduccion> {
    await this.ordenProduccionRepository.update(id, updateOrdenProduccionDto);
    const updatedOrden = await this.findOne(id);
    if (!updatedOrden) {
      throw new NotFoundException(`Orden de producción con ID ${id} no encontrada`);
    }
    return updatedOrden;
  }

  async remove(id: number): Promise<void> {
    const result = await this.ordenProduccionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Orden de producción con ID ${id} no encontrada`);
    }
  }
}