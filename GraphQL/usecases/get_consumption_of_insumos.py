from typing import List, Optional
from ..domain.ports import RestPort


async def get_consumption_of_insumos(rest: RestPort, start: Optional[str] = None, end: Optional[str] = None) -> List[dict]:
    detalles_orden_raw = await rest.get_json('/detalles-orden-produccion')
    ordenes_raw = await rest.get_json('/ordenes-produccion')
    insumos = await rest.get_parsed_list('/insumos', object)

    orden_ids = set()
    if isinstance(ordenes_raw, list):
        for o in ordenes_raw:
            orden_ids.add(o.get('id'))

    totals = {}
    if isinstance(detalles_orden_raw, list):
        for d in detalles_orden_raw:
            if d.get('ordenProduccionId') not in orden_ids:
                continue
            ins_id = d.get('insumoId')
            cantidad = float(d.get('cantidad_utilizada') or 0)
            totals[ins_id] = totals.get(ins_id, 0) + cantidad

    ins_map = {i.id: getattr(i, 'nombre', None) for i in insumos}
    result = []
    for ins_id, cantidad in totals.items():
        result.append({'insumoId': ins_id, 'nombre': ins_map.get(ins_id), 'cantidadNecesaria': cantidad})
    return result
