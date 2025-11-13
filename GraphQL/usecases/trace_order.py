from typing import Optional, List
from ..domain.ports import RestPort


async def trace_order(rest: RestPort, pedidoId: int) -> Optional[dict]:
    try:
        pedido_raw = await rest.get_json(f'/pedidos/{pedidoId}')
    except Exception:
        return None

    try:
        cliente = await rest.get_parsed(f"/clientes/{pedido_raw.get('clienteId')}", object)
    except Exception:
        cliente = None

    detalles_raw = await rest.get_json('/detalles-pedido')
    detalles_for_pedido = [d for d in detalles_raw if d.get('pedidoId') == pedidoId] if isinstance(detalles_raw, list) else []

    recetas_raw = await rest.get_json('/productos-insumos')
    recetas_by_producto = {}
    for r in recetas_raw:
        recetas_by_producto.setdefault(r['productoId'], []).append(r)

    productos_info = await rest.get_parsed_list('/productos', object)
    prod_map = {p.id: getattr(p, 'nombre', None) for p in productos_info}

    productos = []
    for d in detalles_for_pedido:
        pid = d.get('productoId')
        cantidad = float(d.get('cantidad_solicitada') or 0)
        recs = recetas_by_producto.get(pid, [])
        insumos_list = []
        for r in recs:
            insumos_list.append({'insumoId': r['insumoId'], 'nombre': None, 'cantidadNecesaria': float(r.get('cantidad_necesaria') or 0) * cantidad})
        productos.append({'productoId': pid, 'nombre': prod_map.get(pid), 'cantidad': cantidad, 'insumosNecesarios': insumos_list})

    cliente_name = None
    if cliente:
        cliente_name = f"{getattr(cliente, 'nombre', '') or ''} {getattr(cliente, 'apellido', '') or ''}".strip()

    return {'pedidoId': pedidoId, 'clienteName': cliente_name, 'productos': productos}
