package store

import (
	"context"
	"log"
)

type mockWriter struct{}

// PutEvent はローカル環境用モック実装
func (m *mockWriter) PutEvent(_ context.Context, tenantID, userID, orderID, eventType string, payload map[string]any) error {
	log.Printf("[MOCK] DynamoDB PutItem: tenant_id=%s user_id=%s order_id=%s event_type=%s payload=%v\n", tenantID, userID, orderID, eventType, payload)
	return nil
}
