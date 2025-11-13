from typing import List, Optional
from ..domain.models import ClientSales, Cliente, PedidoSummary
from ..domain.ports import RestPort


async def get_sales_by_client(rest: RestPort, start: Optional[str] = None, end: Optional[str] = None) -> List[ClientSales]:
    """Aggregate total sales grouped by cliente using the REST API via RestPort."""
    pedidos_raw = await rest.get_json('/pedidos')
    clients = await rest.get_parsed_list('/clientes', Cliente)

    pedidos = []
    if isinstance(pedidos_raw, list):
        for p in pedidos_raw:
            try:
                pedidos.append(PedidoSummary(**{ 'id': p.get('id'), 'total': p.get('total'), 'clienteId': p.get('clienteId')}))
            except Exception:
                continue

    totals_by_client = {}
    for p in pedidos:
        totals_by_client[p.clienteId] = totals_by_client.get(p.clienteId, 0) + float(p.total or 0)

    result = []
    for c in clients:
        total = totals_by_client.get(c.id, 0)
        result.append(ClientSales(clienteId=c.id, nombre=f"{c.nombre or ''} {c.apellido or ''}".strip(), total=total))

    return result
