**README de pruebas — GraphQL (Sistema-Chifles)**

Resumen
- Este documento explica cómo arrancar y probar la capa GraphQL creada en `GraphQL/`.
- Incluye pasos para ejecutar el servidor, hacer consultas HTTP, ejecutar la schema in-process y consejos de depuración.

Prerequisitos
- Windows (PowerShell). El shell de ejemplo usa `pwsh`.
- Python 3.10+ (en este proyecto se probó con 3.11/3.14). Tener `python` accesible desde la terminal.
- Dependencias Python instaladas desde `GraphQL/requirements.txt`.
- La API REST (NestJS) debe estar disponible en `http://127.0.0.1:3000/chifles` para la mayoría de consultas.

Instalación de dependencias
1. Abrir PowerShell en la raíz del repo (`C:\Sistema-Chifles`).
2. Instalar dependencias (si no están instaladas):

```pwsh
python -m pip install -r .\GraphQL\requirements.txt
```

Configurar variables de entorno
- Copiar `.env.example` si existe, o crear un `.env` en la carpeta `GraphQL/`.
- Valores recomendados:

```
API_URL=http://127.0.0.1:3000/chifles
PORT=8000
DEBUG=True
```

Notas importantes
- Use `127.0.0.1` en `API_URL` en lugar de `localhost` para evitar problemas con IPv6 (::1) que pueden devolver "Empty reply from server" en este entorno.
- Si la API REST no está levantada, algunas queries fallarán o devolverán listas vacías.

Levantar la API REST (si es necesario)
- Si usa Docker Compose desde `Api-Rest/`:

```pwsh
cd .\Api-Rest
docker compose up --build -d
```

Arrancar el servidor GraphQL (uvicorn)
Desde la raíz del repo:

```pwsh
python -m uvicorn GraphQL.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Ver el estado de salud
- Endpoint HTTP de salud:

```pwsh
Invoke-RestMethod -Method GET -Uri http://127.0.0.1:8000/health | ConvertTo-Json
```

Probar GraphQL vía HTTP (ejemplos)
- Usar `Invoke-RestMethod` o `curl`. Asegúrese del `Content-Type: application/json`.

Ejemplo: `salesByClient` (PowerShell):

```pwsh
$body = @{ query = '{ salesByClient { clientId clientName total } }' } | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://127.0.0.1:8000/graphql -Body $body -ContentType 'application/json' | ConvertTo-Json
```

Ejemplo con `curl`:

```pwsh
curl -X POST http://127.0.0.1:8000/graphql -H "Content-Type: application/json" -d '{"query":"{ salesByClient { clientId clientName total } }"}'
```

Ejecutar la schema in-process (útil para depurar sin dependencias HTTP)
- Hay un script utilitario `GraphQL/exec_schema_inproc.py` que ejecuta queries contra la schema importada y usa el `RESTClient` inyectado.
- Ejecutarlo desde la raíz del proyecto:

```pwsh
python .\GraphQL\exec_schema_inproc.py
```

Este script es útil cuando el endpoint HTTP `/graphql` devuelve `422` por razones del body/headers o cuando quiere validar resolvers localmente.

Ejemplos de queries útiles
- salesByClient:

```graphql
{ salesByClient(start: "2025-01-01", end: "2025-12-31") { clientId clientName total }}
```

- traceOrder (detallar pedido):

```graphql
{ traceOrder(pedidoId: 123) { pedidoId clienteName productos { productoId nombre cantidad insumosNecesarios { insumoId nombre cantidadNecesaria } } } }
```

Depuración común
- Respuesta 422 al `POST /graphql`: suele indicar que falta el campo `query` en el JSON o que `Content-Type` no es `application/json`. Asegúrese de enviar el JSON correctamente (ver ejemplos).
- Empty reply / conexión fallida con `localhost`: use `127.0.0.1` y confirme que la API REST está escuchando en el puerto `3000`.
- Problemas con Pydantic/Python: el proyecto evita `BaseSettings` por compatibilidad; el `Settings` usa `dotenv`.

Modo desarrollador: recargar automaticamente
- Use la opción `--reload` de `uvicorn` (ver comando arriba) para trabajarlo en modo desarrollo.

Ejecutar pruebas unitarias (sugerencia)
- No hay pruebas automáticas incluidas por defecto para GraphQL en este repo, pero puede añadir `pytest` + `respx` para moquear peticiones HTTP y probar los usecases.
- Comando sugerido (si añade tests):

```pwsh
python -m pytest -q
```

Checklist rápido
- [ ] La API REST está levantada en `http://127.0.0.1:3000/chifles`.
- [ ] Crear `.env` en `GraphQL/` con `API_URL` correcto.
- [ ] Instalar requerimientos Python.
- [ ] Arrancar `uvicorn` y probar `GET /health`.
- [ ] Hacer una consulta GraphQL de ejemplo (ver `salesByClient`).

¿Quieres que ejecute ahora `exec_schema_inproc.py` y pegue la salida aquí para confirmarlo? Si sí, lo ejecuto y te muestro el resultado.
