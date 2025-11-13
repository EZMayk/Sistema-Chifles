from typing import Optional, List
from pydantic import BaseModel


class Cliente(BaseModel):
    id: int
    nombre: Optional[str]
    apellido: Optional[str]
    dni: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class Producto(BaseModel):
    id: int
    nombre: Optional[str]
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    unidad_medida: Optional[str] = None
    estado: Optional[str] = None


class Insumo(BaseModel):
    id: int
    nombre: Optional[str]
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock: Optional[float] = None
    estado: Optional[str] = None


class DetallePedido(BaseModel):
    id: Optional[int] = None
    cantidad_solicitada: Optional[float] = None
    precio_unitario: Optional[float] = None
    subtotal: Optional[float] = None
    productoId: Optional[int] = None
    pedidoId: Optional[int] = None


class Pedido(BaseModel):
    id: int
    fecha: Optional[str] = None
    total: Optional[float] = None
    estado: Optional[str] = None
    clienteId: Optional[int] = None
    facturaId: Optional[int] = None
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
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    estado: Optional[str] = None
    productoId: Optional[int] = None
    cantidad_producir: Optional[float] = None
    detalles: Optional[List[DetalleOrdenProduccion]] = []


class Factura(BaseModel):
    id: int
    fecha_emision: Optional[str] = None
    total: Optional[float] = None
    estado_pago: Optional[str] = None
    clienteId: Optional[int] = None
    pedidoId: Optional[int] = None


class PedidoSummary(BaseModel):
    id: int
    total: Optional[float]
    clienteId: Optional[int]


class ClientSales(BaseModel):
    clienteId: int
    nombre: Optional[str]
    total: float
