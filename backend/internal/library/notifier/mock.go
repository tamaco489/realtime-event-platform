package notifier

import (
	"context"
	"log"
)

type mockPublisher struct{}

// PublishEvent はローカル環境用モック実装
func (m *mockPublisher) PublishEvent(_ context.Context, eventType string, payload map[string]any, tenantID, userID string) error {
	log.Printf("[MOCK] AppSync PublishEvent: tenant_id=%s user_id=%s event_type=%s payload=%v\n", tenantID, userID, eventType, payload)
	return nil
}
