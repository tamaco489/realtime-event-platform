package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/auth"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

type Handler struct {
	producer producer.Producer
	verifier auth.Verifier
	isLocal  bool
}

func NewHandler(p producer.Producer, v auth.Verifier, isLocal bool) *Handler {
	return &Handler{producer: p, verifier: v, isLocal: isLocal}
}

type postTicketOrderRequest struct {
	EventID   string `json:"event_id"`
	EventName string `json:"event_name"`
	SeatType  string `json:"seat_type"`
	Quantity  int    `json:"quantity"`
	Amount    int    `json:"amount"`
}

type sqsMessage struct {
	Payload   map[string]any `json:"payload"`
	EventType string         `json:"event_type"`
	TenantID  string         `json:"tenant_id"`
	UserID    string         `json:"user_id"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if err := r.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	claims, ok := h.authenticate(w, r)
	if !ok {
		return
	}

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
		TenantID:  claims.TenantID,
		UserID:    claims.UserID,
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

// authenticate はローカル環境では固定クレームを返す。本番環境では JWT を検証する。
func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) (*auth.Claims, bool) {
	if h.isLocal {
		return &auth.Claims{TenantID: "tenant-xxx01", UserID: "local-user-id"}, true
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		writeJSONError(w, "authorization header is required", http.StatusUnauthorized)
		return nil, false
	}
	tokenString, ok := strings.CutPrefix(authHeader, "Bearer ")
	if !ok || tokenString == "" {
		writeJSONError(w, "authorization header must be Bearer token", http.StatusUnauthorized)
		return nil, false
	}

	claims, err := h.verifier.Verify(r.Context(), tokenString)
	if err != nil {
		writeJSONError(w, "invalid or expired token", http.StatusUnauthorized)
		return nil, false
	}

	if claims.TenantID == "" || claims.UserID == "" {
		writeJSONError(w, "tenantId or userId missing in token", http.StatusForbidden)
		return nil, false
	}

	return claims, true
}

func writeJSONError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": msg}); err != nil {
		log.Println(err)
	}
}
