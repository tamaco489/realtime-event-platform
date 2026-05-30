package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

type Handler struct{ producer producer.Producer }

func NewHandler(p producer.Producer) *Handler {
	return &Handler{producer: p}
}

type postEventsRequest struct {
	EventType string          `json:"event_type"`
	Payload   json.RawMessage `json:"payload"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if err := r.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	var req postEventsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.EventType == "" {
		writeJSONError(w, "event_type is required", http.StatusBadRequest)
		return
	}

	body, err := json.Marshal(req)
	if err != nil {
		writeJSONError(w, "failed to marshal request", http.StatusInternalServerError)
		return
	}

	if err := h.producer.Send(r.Context(), string(body)); err != nil {
		writeJSONError(w, "failed to send message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}

func writeJSONError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": msg}); err != nil {
		log.Println(err)
	}
}
