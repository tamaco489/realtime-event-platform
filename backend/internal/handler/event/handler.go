package event

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Handle(ctx context.Context, sqsEvent events.SQSEvent) error {
	log.Printf("event handler invoked: records=%d", len(sqsEvent.Records))
	for _, record := range sqsEvent.Records {
		log.Printf("message_id=%s body=%s", record.MessageId, record.Body)
	}
	return nil
}
