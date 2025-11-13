from typing import List
from ..domain.ports import RestPort


async def get_invoices_by_month(rest: RestPort, year: int) -> List[dict]:
    facturas_raw = await rest.get_json('/facturas')
    clients = await rest.get_parsed_list('/clientes', object)
    client_map = {c.id: f"{getattr(c,'nombre',None) or ''} {getattr(c,'apellido',None) or ''}".strip() for c in clients}

    totals = {}
    if isinstance(facturas_raw, list):
        for f in facturas_raw:
            fecha = f.get('fecha_emision')
            # naive parse year by prefix
            if not fecha or not str(fecha).startswith(str(year)):
                continue
            cid = f.get('clienteId')
            month = int(str(fecha)[5:7]) if len(str(fecha)) >= 7 else 0
            totals.setdefault((cid, month), 0)
            totals[(cid, month)] += float(f.get('total') or 0)

    results = []
    for (cid, month), total in totals.items():
        results.append({'clientId': cid, 'clientName': client_map.get(cid), 'month': month, 'total': total})
    return results
