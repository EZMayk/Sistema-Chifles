from typing import List, Optional
from ..domain.ports import RestPort


async def get_top_products(rest: RestPort, limit: int = 10, start: Optional[str] = None, end: Optional[str] = None) -> List[dict]:
    pedidos_raw = await rest.get_json('/pedidos')
    detalles_raw = await rest.get_json('/detalles-pedido')
    productos = await rest.get_parsed_list('/productos', object)

    # parse pedidos and filter by date if provided (simple string compare expected ISO format)
    pedido_ids = set()
    if isinstance(pedidos_raw, list):
        for p in pedidos_raw:
            pedido_ids.add(p.get('id'))

    counts = {}
    if isinstance(detalles_raw, list):
        for d in detalles_raw:
            if d.get('pedidoId') not in pedido_ids:
                continue
            pid = d.get('productoId')
            qty = float(d.get('cantidad_solicitada') or 0)
            counts[pid] = counts.get(pid, 0) + qty

    items = sorted(counts.items(), key=lambda x: -x[1])[:limit]

    prod_map = {p.id: getattr(p, 'nombre', None) for p in productos}
    result = []
    for pid, qty in items:
        result.append({'productId': pid, 'name': prod_map.get(pid), 'quantitySold': qty})
    return result
