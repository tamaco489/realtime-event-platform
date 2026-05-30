package api

import (
	"io"
	"log"
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

type Handler struct{ producer producer.Producer }

func NewHandler(p producer.Producer) *Handler {
	return &Handler{producer: p}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if err := r.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}

	if err := h.producer.Send(r.Context(), string(body)); err != nil {
		http.Error(w, "failed to send message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}
