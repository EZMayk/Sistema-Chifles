import strawberry
from typing import Optional, List


@strawberry.type
class ClientSales:
    clientId: int
    clientName: Optional[str]
    total: float


@strawberry.type
class TopProduct:
    productId: int
    name: Optional[str]
    quantitySold: float


@strawberry.type
class InsumoUsage:
    insumoId: int
    nombre: Optional[str]
    cantidadNecesaria: float


@strawberry.type
class ProductTrace:
    productoId: int
    nombre: Optional[str]
    cantidad: float
    insumosNecesarios: List[InsumoUsage]


@strawberry.type
class PedidoTrace:
    pedidoId: int
    clienteName: Optional[str]
    productos: List[ProductTrace]
