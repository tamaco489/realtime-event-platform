package api

import (
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

type Handler struct{ producer producer.Producer }

func NewHandler(p producer.Producer) *Handler {
	return &Handler{producer: p}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {}
