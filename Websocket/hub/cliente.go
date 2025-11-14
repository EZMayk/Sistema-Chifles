package hub

import "github.com/gorilla/websocket"

type Client struct {
    Hub  *Hub
    Conn *websocket.Conn
    Send chan []byte
}

// Lee mensajes del cliente
func (c *Client) ReadPump() {
    defer func() {
        c.Hub.Unregister <- c
        c.Conn.Close()
    }()

    for {
        _, message, err := c.Conn.ReadMessage()
        if err != nil {
            break
        }
        c.Hub.Broadcast <- message
    }
}

// Envía mensajes al cliente
func (c *Client) WritePump() {
    defer c.Conn.Close()

    for {
        msg, ok := <-c.Send
        if !ok {
            c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
            return
        }
        c.Conn.WriteMessage(websocket.TextMessage, msg)
    }
}
