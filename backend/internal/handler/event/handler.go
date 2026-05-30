package event

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

type eventMessage struct {
	Payload   map[string]any `json:"payload"`
	EventType string         `json:"event_type"`
}

func (h *Handler) Handle(ctx context.Context, sqsEvent events.SQSEvent) error {
	log.Printf("event handler invoked: records=%d", len(sqsEvent.Records))
	for _, record := range sqsEvent.Records {
		var msg eventMessage
		if err := json.Unmarshal([]byte(record.Body), &msg); err != nil {
			log.Printf("skip: failed to parse record: message_id=%s err=%v", record.MessageId, err)
			continue
		}
		log.Printf("message_id=%s event_type=%s payload=%v", record.MessageId, msg.EventType, msg.Payload)
	}
	return nil
}
