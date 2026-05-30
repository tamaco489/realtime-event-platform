package store

import (
	"context"
	"log"
)

type mockWriter struct{}

func (m *mockWriter) PutEvent(_ context.Context, eventType string, payload map[string]any) error {
	log.Printf("[MOCK] DynamoDB PutItem: event_type=%s payload=%v\n", eventType, payload)
	return nil
}
