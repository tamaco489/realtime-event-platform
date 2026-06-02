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

type postTicketOrderRequest struct {
	EventID   string `json:"event_id"`
	EventName string `json:"event_name"`
	SeatType  string `json:"seat_type"`
	Quantity  int    `json:"quantity"`
	Amount    int    `json:"amount"`
}

type sqsMessage struct {
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if err := r.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	var req postTicketOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.EventID == "" || req.EventName == "" || req.SeatType == "" {
		writeJSONError(w, "event_id, event_name and seat_type are required", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 || req.Amount <= 0 {
		writeJSONError(w, "quantity and amount must be greater than 0", http.StatusBadRequest)
		return
	}

	msg := sqsMessage{
		EventType: "created",
		Payload: map[string]any{
			"event_id":   req.EventID,
			"event_name": req.EventName,
			"seat_type":  req.SeatType,
			"quantity":   req.Quantity,
			"amount":     req.Amount,
		},
	}

	body, err := json.Marshal(msg)
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
