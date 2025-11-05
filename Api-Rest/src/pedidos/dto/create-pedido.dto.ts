import { IsString, IsNumber, IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleDto } from '../../detalles-pedido/dto/create-detalles-pedido.dto';

export class CreatePedidoDto {
  @IsString()
  fecha: string;

  @IsNumber()
  total: number;

  @IsString()
  estado: string;

  @IsInt()
  clienteId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleDto)
  detalles: CreateDetalleDto[];
}

