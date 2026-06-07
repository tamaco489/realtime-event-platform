package store

import "context"

type EventWriter interface {
	PutEvent(ctx context.Context, tenantID, userID, orderID, eventType string, payload map[string]any) error
}
