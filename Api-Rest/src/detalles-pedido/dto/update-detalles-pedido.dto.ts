import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleDto } from './create-detalles-pedido.dto';

export class UpdateDetallePedidoDto extends PartialType(CreateDetalleDto) {}