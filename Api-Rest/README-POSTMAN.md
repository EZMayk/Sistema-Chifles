# Probar el sistema con Postman

Este documento explica paso a paso cómo probar el flujo completo de la API "Chifles" usando Postman (crear cliente → producto → insumo → receta producto-insumo → pedido con detalles → factura → orden de producción y detalles automáticos).

## Requisitos
- Docker y Docker Compose instalados (se usa docker-compose.yml en la raíz del proyecto).
- Node/NPM (opcional, para ejecutar scripts locales como el runner PowerShell).
- Postman (o Newman para ejecución automática desde CLI).

## Archivos útiles en el repo
- `test/postman-collection-chifles.json` — colección Postman lista para importar. Contiene requests ordenados y tests que guardan IDs en variables de entorno.
- `test/e2e-runner.ps1` — runner PowerShell que ejecuta el flujo completo contra `http://localhost:3000/chifles` (útil para pruebas rápidas desde Windows / PowerShell).

## 1) Levantar la API y la base de datos

Usa Docker Compose para levantar la API y Postgres. Desde la raíz del proyecto (Windows PowerShell):

```powershell
# Parar cualquier instancia previa y levantar en background
docker compose down -v
docker compose up --build -d

# Ver logs (opcional)
docker compose logs -f api-rest-sistema
```

Espera a que el contenedor de la API inicie y muestre en logs: "Nest application successfully started" (o que `GET http://localhost:3000/chifles/clientes` devuelva 200).

## 2) Importar la colección en Postman

- Abre Postman → Import → File → selecciona `test/postman-collection-chifles.json`.
- Crea un Environment (opcional) y verifica que la variable `baseUrl` está definida. Por defecto la colección usa `http://localhost:3000/chifles`.

## 3) Ejecutar la colección paso a paso

La colección contiene los siguientes requests en orden y con tests que almacenan variables de entorno:

- 01 - Crear cliente  -> guarda `clienteId`
- 02 - Crear producto -> guarda `productoId`
- 03 - Crear insumo   -> guarda `insumoId`
- 04 - Crear producto-insumo (receta) -> guarda `productoInsumoId`
- 05 - Crear orden de producción -> guarda `ordenId` (devuelve `detalles` si hay receta)
- 06 - Crear pedido con detalle -> guarda `pedidoId`
- 07 - Crear factura asociada -> guarda `facturaId`
- 08 - GET detalles de pedido (verifica `detalles` del pedido)
- 09 - GET detalles de orden de producción (verifica `detalles` generados automáticamente)

Ejecuta uno por uno o usa el Runner de Postman para ejecutar la colección completa.

## Ejemplos de payloads (JSON)

A continuación tienes ejemplos listos en JSON para pegar en Postman en cada request del flujo. Ajusta valores como fechas, ids y montos según necesites.

- Crear cliente (POST /chifles/clientes)

```json
{
  "nombre": "María",
  "apellido": "González",
  "dni": "7845123089",
  "telefono": "987654321",
  "email": "maria.gonzales@gmail.com"
}
```

- Crear producto (POST /chifles/productos)

```json
{
	"nombre": "Chifles Tradicional",
	"descripcion": "Chifles fritos salados - bolsa 200g",
	"precio": 3.5,
	"categoria": "snack",
	"unidad_medida": "bolsa",
	"estado": "activo"
}
```

- Crear insumo (POST /chifles/insumos)

```json
{
	"nombre": "Plátano verde",
	"descripcion": "Plátano para fritura - kg",
	"unidad_medida": "kg",
	"stock": 100,
	"estado": "disponible"
}
```

- Crear producto-insumo / receta (POST /chifles/productos-insumos)

```json
{
	"productoId": 1,
	"insumoId": 1,
	"cantidad_necesaria": 0.5
}
```

- Crear orden de producción (POST /chifles/ordenes-produccion)

```json
{
	"fecha_inicio": "2025-11-11T08:00:00Z",
	"fecha_fin": "2025-11-11T12:00:00Z",
	"estado": "planificada",
	"productoId": 1,
	"cantidad_producir": 10
}
```

- Crear pedido con detalles (POST /chifles/pedidos)

```json
{
	"fecha": "2025-11-11T10:00:00Z",
	"total": 7.0,
	"estado": "pendiente",
	"clienteId": 1,
	"detalles": [
		{
			"productoId": 1,
			"cantidad_solicitada": 2,
			"precio_unitario": 3.5,
			"subtotal": 7.0
		}
	]
}
```

- Crear factura asociada (POST /chifles/facturas)

```json
{
	"fecha_emision": "2025-11-10T11:00:00Z",
	"total": 901.0,
	"estado_pago": "pendiente",
	"clienteId": 1,
	"pedidoId": 1
}
```


## 4) Qué validar en las respuestas

- Cada POST debería devolver HTTP 201 y un objeto con `id`.
- Para `pedidos`: el objeto devuelto debe incluir `detalles` (array) con campos: `productoId`, `cantidad_solicitada`, `precio_unitario`, `subtotal`.
- Para `ordenes-produccion`: la respuesta debe incluir `detalles` con `insumoId` y `cantidad_utilizada`. El valor esperado es `cantidad_utilizada = cantidad_necesaria * cantidad_producir`.

## 5) Ejecutar la colección vía CLI (Newman)

Instala newman globalmente (opcional):

```powershell
npm i -g newman
```

Ejecuta la colección (si quieres usar un Environment exportado desde Postman, pásalo con `-e`):

```powershell
newman run test/postman-collection-chifles.json -e ./test/postman-environment.json --delay-request 200
```

Parámetros útiles:
- `--delay-request 200` añade 200ms entre requests para dar tiempo al backend si tu entorno está lento.

## 6) Limpieza / datos de prueba

Si quieres dejar la base de datos limpia después de las pruebas puedes:

- Ejecutar manualmente DELETE en los endpoints correspondientes (no hay un endpoint global de limpieza por defecto).
- Usar la consola de Postgres (dentro del contenedor) o un script SQL para borrar filas de las tablas de prueba.

Ejemplo rápido para borrar los registros creados (desde PowerShell usando curl):

```powershell
# Borrar pedidos/ordenes creados (ADAPTA los ids según tu ejecución)
curl -X DELETE http://localhost:3000/chifles/pedidos/1
curl -X DELETE http://localhost:3000/chifles/ordenes-produccion/5
# Borrar productos/insumos
curl -X DELETE http://localhost:3000/chifles/productos/4
curl -X DELETE http://localhost:3000/chifles/insumos/4
```

## 7) Problemas comunes y soluciones

- 400 Bad Request: revisa que el JSON incluya los campos requeridos (por ejemplo `fecha_inicio` y `fecha_fin` para órdenes).
- 500 / errores del contenedor: mira logs con `docker compose logs api-rest-sistema --tail 200`.
- Puertos: por defecto la API corre en `localhost:3000`. Si tu entorno usa otro puerto, actualiza `baseUrl` en el Environment de Postman.
- Decimales: TypeORM puede devolver valores numéricos como strings (dependiendo del driver). En scripts de test, conviértelos con `Number(...)` o `parseFloat(...)` antes de comparar.

## 8) Automatización alternativa

- Ya existe `test/e2e-runner.ps1` que ejecuta el flujo completo desde PowerShell y valida la generación de detalles. Puedes ejecutar:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File test/e2e-runner.ps1
```

Si quieres que integre limpieza automática o que agregue más aserciones, puedo actualizarlo.

## 9) Contacto / siguientes pasos

Si quieres que:
- Genere un Environment JSON listo para importar en Postman (variables vacías con `baseUrl`) — dimelo y lo añado.
- Añada requests de limpieza al inicio/fin de la colección para hacer pruebas repetibles — lo implemento.
- Convierta la colección a un pipeline de CI (ej. script que levante docker-compose, ejecute newman y baje contenedores) — también puedo hacerlo.

¡Listo! Con esto deberías poder importar la colección y ejecutar el flujo completo en Postman. Si quieres, puedo crear el Environment JSON y/o el npm script que ejecute Newman. ¿Cuál prefieres?
