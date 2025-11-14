package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"websocket/hub"
	"websocket/models"
)

type IncomingEvent struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
	Secret  string      `json:"secret,omitempty"` 
}

func NotifyEventHandler(h *hub.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Sólo POST
		if r.Method != http.MethodPost {
			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Error leyendo body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Parsear JSON
		var event IncomingEvent
		if err := json.Unmarshal(body, &event); err != nil {
			http.Error(w, "JSON inválido: "+err.Error(), http.StatusBadRequest)
			return
		}

		providedSecret := r.Header.Get("X-WS-SECRET")
		if providedSecret == "" {
			providedSecret = event.Secret
		}

		if providedSecret == "" || providedSecret != os.Getenv("WS_SECRET") {
			http.Error(w, "No autorizado", http.StatusUnauthorized)
			return
		}

		if !models.IsValidEvent(event.Type) {
			fmt.Println("Evento inválido recibido:", event.Type)
			http.Error(w, "Tipo de evento inválido: "+event.Type, http.StatusBadRequest)
			return
		}

		msg, err := json.Marshal(map[string]interface{}{
			"type":    event.Type,
			"payload": event.Payload,
		})
		if err != nil {
			http.Error(w, "Error serializando evento", http.StatusInternalServerError)
			return
		}

		h.Broadcast <- msg

		// Log y respuesta
		fmt.Println("Evento recibido y retransmitido:", event.Type)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}
