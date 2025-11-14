**README — Probar el servicio GraphQL (Sistema-Chifles)**

Este documento explica, de forma concisa y práctica, cómo levantar y probar la capa GraphQL localizada en `GraphQL/`.

Resumen rápido
- La capa GraphQL consulta la API REST principal en `Api-Rest/` (por defecto `http://127.0.0.1:3000/chifles`).
- En Windows es recomendable usar `127.0.0.1` en lugar de `localhost` para evitar problemas IPv6/IPv4.

Prerequisitos
- Windows / PowerShell (`pwsh`) (o cualquier OS con Python si usas los comandos `uvicorn`).
- Python 3.8+ (en este workspace se probó con Python 3.14; ver nota Pydantic abajo).
- Docker (opcional, solo si vas a levantar la API REST con docker-compose).

1) Arrancar la API REST (si no está ya arriba)

Si usas Docker Compose desde la carpeta `Api-Rest`:

```pwsh
cd .\Api-Rest
docker compose up --build -d
```

Comprueba que responde (ejemplo productos):

```pwsh
Invoke-RestMethod -Method GET -Uri http://127.0.0.1:3000/chifles/productos | ConvertTo-Json -Depth 5
```

2) Preparar el entorno Python para GraphQL

```pwsh
cd .\GraphQL
python -m venv .venv        
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

3) Configurar variables de entorno

Copia el ejemplo y edita si es necesario:

```pwsh
Copy-Item .\.env.example .\.env -Force
# Edita .\.env para ajustar API_URL o PORT si lo deseas (ej. PORT=8001)
```

4) Iniciar el servicio GraphQL

Opción A (recomendada en Windows): usar el script con fallback automático de puerto:

```pwsh
pwsh .\scripts\start-graphql.ps1
```

Opción B: arrancar directamente con `uvicorn` (elige puerto libre, 8001 recomendado si 8000 está ocupado):

```pwsh
python -m uvicorn GraphQL.app.main:app --host 127.0.0.1 --port 8001 --reload
```

Opción C: arrancar en segundo plano (PowerShell):

```pwsh
Start-Process -NoNewWindow -FilePath python -ArgumentList '-m uvicorn GraphQL.app.main:app --host 127.0.0.1 --port 8001 --reload'
```

5) Comprobar que el servidor GraphQL está vivo

Health check (ajusta puerto si usaste otro):

```pwsh
Invoke-RestMethod -Method GET -Uri http://127.0.0.1:8001/health | ConvertTo-Json
```

6) Probar consultas GraphQL (PowerShell)

- `salesByClient` (consulta simple):

```pwsh
$body = @{ query = '{ salesByClient { clientId clientName total } }' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8001/graphql -Body $body -ContentType 'application/json' | ConvertTo-Json
```

- `traceOrder` (detallar un pedido):

```pwsh
$q = 'query { traceOrder(pedidoId: 1) { pedidoId clienteName productos { productoId nombre cantidad insumosNecesarios { insumoId nombre cantidadNecesaria } } } }'
$body = @{ query = $q } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8001/graphql -Body $body -ContentType 'application/json' | ConvertTo-Json
```

Ejemplo con `curl` (cross-platform):

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"query":"{ salesByClient { clientId clientName total } }"}' \
  http://127.0.0.1:8001/graphql | jq
```

7) Ejecutar la schema in-process (útil si `/graphql` devuelve 422)

Si el endpoint HTTP `/graphql` te da `422` o problemas con headers, puedes ejecutar los resolvers directamente sin HTTP:

```pwsh
python .\exec_schema_inproc.py
```

8) Troubleshooting rápido (WinError 10013 / puerto ocupado)

- Si ves `WinError 10013` al intentar arrancar en `8000`, normalmente el puerto está ocupado o un firewall/antivirus lo bloquea.
- Diagnóstico básico:

```pwsh
netstat -ano | Select-String ':8000'
Get-NetTCPConnection -LocalPort 8000
```

- Identificar proceso (reemplaza `<PID>`):

```pwsh
Get-Process -Id <PID> | Format-List Id,ProcessName,Path
```

- Si confirmas que es seguro, detener proceso:

```pwsh
Stop-Process -Id <PID> -Force
```

- Alternativa segura: arrancar en otro puerto (p. ej. `8001`) o usar el script `start-graphql.ps1` que lo hace por ti.

9) Notas y recomendaciones

- Usa `127.0.0.1` en Windows para evitar problemas con `localhost`.
- Pydantic y Python 3.14: verás un `UserWarning` sobre compatibilidad de Pydantic v1 con Python 3.14. Es informativo y no impide que el servicio funcione, pero considera usar Python 3.11 o Pydantic v2 si lo deseas.
- Para reproducibilidad en equipos mixtos, considera ejecutar los scripts cross-platform (puedo generarte un `start_uvicorn.py` si lo prefieres).

10) ¿Necesitas más ejemplos o automatización?

- Puedo añadir al README ejemplos de payloads para crear `pedidos`, `ordenes-produccion` y `detalles-orden-produccion` si quieres pruebas E2E.
- Puedo convertir los scripts `.ps1` clave a un pequeño script Python cross-platform.

-- Fin