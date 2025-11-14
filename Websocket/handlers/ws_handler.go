package handlers

import (
    "fmt"
    "net/http"
    "github.com/gorilla/websocket"
    "websocket/hub"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

// Maneja conexiones WebSocket entrantes
func ServeWs(h *hub.Hub, w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        http.Error(w, "No se pudo abrir la conexión WebSocket", http.StatusBadRequest)
        return
    }

    client := &hub.Client{
        Hub:  h,
        Conn: conn,
        Send: make(chan []byte, 256),
    }

    fmt.Println("💬 Cliente conectado desde:", r.RemoteAddr)

    h.Register <- client

    go client.WritePump()
    go client.ReadPump()
}
