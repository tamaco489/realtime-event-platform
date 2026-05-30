package store

import "context"

type EventWriter interface {
	PutEvent(ctx context.Context, eventType string, payload map[string]any) error
}
