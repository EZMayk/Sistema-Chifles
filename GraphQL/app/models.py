from typing import Optional, List
from pydantic import BaseModel


class Cliente(BaseModel):
    id: int
    nombre: Optional[str]
    apellido: Optional[str]
    dni: Optional[str]
    telefono: Optional[str]
    email: Optional[str]


class Producto(BaseModel):
    id: int
    nombre: Optional[str]
    descripcion: Optional[str]
    precio: Optional[float]
    categoria: Optional[str]
    unidad_medida: Optional[str]
    estado: Optional[str]


class Insumo(BaseModel):
    id: int
    nombre: Optional[str]
    descripcion: Optional[str]
    unidad_medida: Optional[str]
    stock: Optional[float]
    estado: Optional[str]


class DetallePedido(BaseModel):
    id: Optional[int]
    cantidad_solicitada: Optional[float]
    precio_unitario: Optional[float]
    subtotal: Optional[float]
    productoId: Optional[int]
    pedidoId: Optional[int]


class Pedido(BaseModel):
    id: int
    fecha: Optional[str]
    total: Optional[float]
    estado: Optional[str]
    clienteId: Optional[int]
    facturaId: Optional[int]
    detalles: Optional[List[DetallePedido]] = []


class ProductoInsumo(BaseModel):
    id: int
    productoId: int
    insumoId: int
    cantidad_necesaria: float


class DetalleOrdenProduccion(BaseModel):
    id: int
    ordenProduccionId: int
    insumoId: int
    cantidad_utilizada: float


class OrdenProduccion(BaseModel):
    id: int
    fecha_inicio: Optional[str]
    fecha_fin: Optional[str]
    estado: Optional[str]
    productoId: Optional[int]
    cantidad_producir: Optional[float]
    detalles: Optional[List[DetalleOrdenProduccion]] = []


class Factura(BaseModel):
    id: int
    fecha_emision: Optional[str]
    total: Optional[float]
    estado_pago: Optional[str]
    clienteId: Optional[int]
    pedidoId: Optional[int]
