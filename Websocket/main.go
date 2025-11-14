package main

import (
    "fmt"
    "log"
    "net/http"
    "websocket/config"
    "websocket/hub"
    "websocket/handlers"
)

func main() {
    cfg := config.LoadConfig()
    h := hub.NewHub()
    go h.Run()

    // Ruta para conexiones WebSocket (clientes)
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        handlers.ServeWs(h, w, r)
    })

    // Ruta para notificaciones desde la API REST
    http.HandleFunc("/notify", handlers.NotifyEventHandler(h))

    fmt.Printf("Servidor WebSocket corriendo en puerto %s\n", cfg.Port)
    if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
        log.Fatal("Error al iniciar el servidor WebSocket:", err)
    }
}
