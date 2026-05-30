package sqs

import (
	"context"
	"log"
)

type mockPublisher struct{}

func (m *mockPublisher) SendMessage(ctx context.Context, body string) error {
	log.Printf("[MOCK] SQS SendMessage: %s\n", body)
	return nil
}
