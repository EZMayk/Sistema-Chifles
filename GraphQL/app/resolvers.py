from typing import List, Optional
import strawberry

from .clients import RESTClient
from .adapters.rest_adapter import RestAdapter
from ..usecases.get_sales_by_client import get_sales_by_client
from .schema_types import ClientSales
from ..usecases.get_top_products import get_top_products
from ..usecases.get_consumption_of_insumos import get_consumption_of_insumos
from ..usecases.trace_order import trace_order
from ..usecases.get_invoices_by_month import get_invoices_by_month
from .schema_types import TopProduct, InsumoUsage, ProductTrace, PedidoTrace


@strawberry.type
class Query:

    @strawberry.field
    async def health(self) -> str:
        return "ok"

    @strawberry.field
    async def salesByClient(self, info, start: Optional[str] = None, end: Optional[str] = None) -> List[ClientSales]:
        # info.context is populated by the FastAPI context_getter in main
        client: RESTClient = info.context['rest']
        adapter = RestAdapter(client)
        sales = await get_sales_by_client(adapter, start=start, end=end)
        return [ClientSales(clientId=s.clienteId, clientName=s.nombre, total=s.total) for s in sales]

    @strawberry.field
    async def topProducts(self, info, limit: int = 10, start: Optional[str] = None, end: Optional[str] = None) -> List[TopProduct]:
        client: RESTClient = info.context['rest']
        adapter = RestAdapter(client)
        items = await get_top_products(adapter, limit=limit, start=start, end=end)
        return [TopProduct(productId=i['productId'], name=i.get('name'), quantitySold=i.get('quantitySold')) for i in items]

    @strawberry.field
    async def consumptionOfInsumos(self, info, start: Optional[str] = None, end: Optional[str] = None) -> List[InsumoUsage]:
        client: RESTClient = info.context['rest']
        adapter = RestAdapter(client)
        items = await get_consumption_of_insumos(adapter, start=start, end=end)
        return [InsumoUsage(insumoId=i['insumoId'], nombre=i.get('nombre'), cantidadNecesaria=i.get('cantidadNecesaria')) for i in items]

    @strawberry.field
    async def traceOrder(self, info, pedidoId: int) -> Optional[PedidoTrace]:
        client: RESTClient = info.context['rest']
        adapter = RestAdapter(client)
        data = await trace_order(adapter, pedidoId)
        if not data:
            return None
        productos = [ProductTrace(productoId=p['productoId'], nombre=p.get('nombre'), cantidad=p.get('cantidad'), insumosNecesarios=[InsumoUsage(insumoId=i['insumoId'], nombre=i.get('nombre'), cantidadNecesaria=i.get('cantidadNecesaria')) for i in p.get('insumosNecesarios', [])]) for p in data.get('productos', [])]
        return PedidoTrace(pedidoId=data.get('pedidoId'), clienteName=data.get('clienteName'), productos=productos)

    @strawberry.field
    async def invoicesByMonth(self, info, year: int) -> List[ClientSales]:
        client: RESTClient = info.context['rest']
        adapter = RestAdapter(client)
        rows = await get_invoices_by_month(adapter, year)
        return [ClientSales(clientId=r['clientId'], clientName=r.get('clientName'), total=r.get('total')) for r in rows]
