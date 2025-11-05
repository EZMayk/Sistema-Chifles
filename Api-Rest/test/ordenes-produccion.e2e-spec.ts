import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Producto } from '../src/productos/entities/producto.entity';
import { Insumo } from '../src/insumos/entities/insumo.entity';
import { ProductoInsumo } from '../src/productos-insumos/entities/productos-insumo.entity';
import { DetalleOrdenProduccion } from '../src/detalles-orden-produccion/entities/detalles-orden-produccion.entity';

jest.setTimeout(30000);

describe('OrdenesProduccion E2E', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      // limpiar tablas usadas en el test (solo registros creados por estos tests)
      await dataSource.getRepository(DetalleOrdenProduccion).clear();
      await dataSource.getRepository(ProductoInsumo).clear();
      await dataSource.getRepository(Insumo).clear();
      await dataSource.getRepository(Producto).clear();
    }
    await app.close();
  });

  it('crea producto, insumo, producto-insumo y genera detalles al crear orden', async () => {
    // 1) Crear producto
    const prodResp = await request(server)
      .post('/chifles/productos')
      .send({ nombre: 'E2EProd', descripcion: 'producto e2e', precio: 2.5, categoria: 'snack', unidad_medida: 'kg' })
      .expect(201);

    const productoId = prodResp.body.id;

    // 2) Crear insumo
    const insResp = await request(server)
      .post('/chifles/insumos')
      .send({ nombre: 'E2EHarina', unidad_medida: 'kg', stock: 100 })
      .expect(201);
    const insumoId = insResp.body.id;

    // 3) Crear producto-insumo (receta)
    const piResp = await request(server)
      .post('/chifles/productos-insumos')
      .send({ productoId, insumoId, cantidad_necesaria: 0.25 })
      .expect(201);

    // 4) Crear orden de produccion
    const ordenResp = await request(server)
      .post('/chifles/ordenes-produccion')
      .send({ fecha_inicio: '2025-11-10', fecha_fin: '2025-11-11', productoId, cantidad_producir: 4 })
      .expect(201);

    expect(ordenResp.body).toHaveProperty('detalles');
    expect(Array.isArray(ordenResp.body.detalles)).toBe(true);
    expect(ordenResp.body.detalles.length).toBeGreaterThan(0);

    const detalle = ordenResp.body.detalles.find((d) => d.insumoId === insumoId);
    expect(detalle).toBeDefined();
    // cantidad_utilizada = 0.25 * 4 = 1.0
    expect(Number(detalle.cantidad_utilizada)).toBeCloseTo(1.0);
  });
});
