import { IsInt, Min, IsNumber, IsPositive } from 'class-validator';

export class CreateDetalleDto {
  @IsInt()
  productoId: number;

  @IsInt()
  @Min(1)
  cantidad_solicitada: number;

  @IsNumber()
  @IsPositive()
  precio_unitario: number;

  // subtotal lo puedes calcular en el servidor, pero si lo envían, validar:
  @IsNumber()
  @IsPositive()
  subtotal: number;
}
