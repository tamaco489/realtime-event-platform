package notifier

import "context"

type EventPublisher interface {
	PublishEvent(ctx context.Context, eventType string, payload map[string]any) error
}
