import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallePedido } from './entities/detalles-pedido.entity';
import { CreateDetalleDto } from './dto/create-detalles-pedido.dto';
import { UpdateDetallePedidoDto } from './dto/update-detalles-pedido.dto';

@Injectable()
export class DetallesPedidoService {
  constructor(
    @InjectRepository(DetallePedido)
    private detallePedidoRepository: Repository<DetallePedido>,
  ) {}

  async findAll(): Promise<DetallePedido[]> {
    return this.detallePedidoRepository.find({
      relations: ['producto', 'pedido'],
    });
  }

  async findOne(id: number): Promise<DetallePedido> {
    const detalle = await this.detallePedidoRepository.findOne({
      where: { id },
      relations: ['producto', 'pedido'],
    });
    if (!detalle) {
      throw new NotFoundException(`Detalle de pedido con ID ${id} no encontrado`);
    }
    return detalle;
  }

  async create(createDetalleDto: CreateDetalleDto): Promise<DetallePedido> {
    const detalle = this.detallePedidoRepository.create(createDetalleDto as any);
    const saved = await this.detallePedidoRepository.save(detalle);
    return saved as unknown as DetallePedido;
  }

  async update(id: number, updateDetallePedidoDto: UpdateDetallePedidoDto): Promise<DetallePedido> {
    await this.detallePedidoRepository.update(id, updateDetallePedidoDto);
    const updatedDetalle = await this.findOne(id);
    if (!updatedDetalle) {
      throw new NotFoundException(`Detalle de pedido con ID ${id} no encontrado`);
    }
    return updatedDetalle;
  }

  async remove(id: number): Promise<void> {
    const result = await this.detallePedidoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Detalle de pedido con ID ${id} no encontrado`);
    }
  }

  async findByPedido(pedidoId: number): Promise<DetallePedido[]> {
    return this.detallePedidoRepository.find({
      where: { pedidoId },
      relations: ['producto'],
    });
  }
}