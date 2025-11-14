# Servidor Websocket

# Estructura
websocket/
│
├── config/
│   └── config.go          # Carga variables de entorno (.env)
│
├── handlers/
│   ├── events_handler.go  # Endpoint HTTP /notify para recibir eventos del API REST
│   └── ws_handler.go      # Manejo de conexiones WebSocket entrantes (/ws)
│
├── hub/
│   ├── client.go          # Representa un cliente conectado
│   ├── hub.go             # Administra las conexiones y broadcast
│
├── models/
│   └── events.go          # Definición de los tipos de eventos
│
├── .env                   # Variables de entorno del servidor WebSocket
|── go.sum
├── go.mod                 # Dependencias del módulo Go
├── main.go                # Punto de entrada del servidor
└── README.md              # (Este archivo)

# Instalar dependencias
go mod tidy

# Archivo .env del websocket
//Configuración del servidor WebSocket
PORT=8081

//Clave secreta compartida con la API REST
WS_SECRET=super_secret_key_123

//Origen permitido (frontend que se conectará por WebSocket)
ALLOWED_ORIGIN=http://localhost:5173

# Archivo .env del api-rest (para que funcione correctamente la conexion)
//🗄️ Configuración de base de datos
DB_TYPE=postgres
DB_HOST=api-postgres-sistema-chifles
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=sistema-chifles

//Configuración WebSocket Server
WS_URL=http://172.17.0.1:8081/notify
WS_SECRET=super_secret_key_123

//⚙️ Configuración de la API
PORT=3000

# Requisitos para probarlo
Api rest y contendor docker corriendo
Verificar el archivo docker-compose.yml de la carpeta api rest
Levantar los contenedores con el comando:
    docker compose up --build
Ejecutar el websocket en otra terminal con el comando: 
    go run .
(Mostrara un mensaje de Conexion)
Usar un servicio de cliente (Simple Websocket client - Extension de navegador recomendado) y aplique esta ruta: ws://localhost:8081/ws
(Mostrara un mensaje de cliente conectado)

Usar postman para los crud y use el archivo de prueba (prueba-notificaciones.postman_collection.json)

# Notificaciones esperadas
Notificaciones de creacion= producto, insumo, pedido, orden de produccion, producto-insumo
Notificaciones de editar= producto, producto-insumo
Notificaciones de eliminar= producto, insumo, producto-insumo
Notificaciones de cancelamiento= pedido, orden de produccion
Notificaciones de baja cantidad= insumo
Notificaciones de completo= pedido, orden de produccion