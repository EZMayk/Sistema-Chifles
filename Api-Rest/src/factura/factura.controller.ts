import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe } from '@nestjs/common';
import { FacturasService } from './factura.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { Factura } from './entities/factura.entity';
import { notifyWebSocket } from '../utils/notify-ws';

@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  findAll(): Promise<Factura[]> {
    return this.facturasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Factura> {
    return this.facturasService.findOne(id);
  }

  @Post()
  async create(@Body() createFacturaDto: CreateFacturaDto): Promise<Factura> {
    const factura = await this.facturasService.create(createFacturaDto);

    await notifyWebSocket('invoice.created', factura);

    return factura;
  }


  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacturaDto: UpdateFacturaDto,
  ): Promise<Factura> {
    const facturaActualizada = await this.facturasService.update(id, updateFacturaDto);

    if (updateFacturaDto.estado_pago && updateFacturaDto.estado_pago === 'pagado') {
      await notifyWebSocket('invoice.paid', facturaActualizada);
    }

    return facturaActualizada;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.facturasService.remove(id);
  }
}