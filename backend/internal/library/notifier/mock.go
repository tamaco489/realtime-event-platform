package notifier

import (
	"context"
	"log"
)

type mockPublisher struct{}

func (m *mockPublisher) PublishEvent(_ context.Context, eventType string, payload map[string]any) error {
	log.Printf("[MOCK] AppSync PublishEvent: event_type=%s payload=%v\n", eventType, payload)
	return nil
}
