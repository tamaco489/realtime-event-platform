package producer

import (
	"context"
	"log"
)

type mock struct{}

func (m *mock) Send(ctx context.Context, body string) error {
	log.Printf("[MOCK] SQS Send: %s\n", body)
	return nil
}
