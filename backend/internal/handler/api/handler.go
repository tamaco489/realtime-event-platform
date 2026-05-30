package api

import (
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/sqs"
)

type Handler struct{ publisher sqs.Publisher }

func NewHandler(publisher sqs.Publisher) *Handler {
	return &Handler{publisher: publisher}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {}
