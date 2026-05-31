package event

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/notifier"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/store"
)

type Handler struct {
	store    store.EventWriter
	notifier notifier.EventPublisher
}

func NewHandler(s store.EventWriter, n notifier.EventPublisher) *Handler {
	return &Handler{store: s, notifier: n}
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

		if err := h.store.PutEvent(ctx, msg.EventType, msg.Payload); err != nil {
			log.Printf("skip: failed to put event: message_id=%s err=%v", record.MessageId, err)
			continue
		}

		if err := h.notifier.PublishEvent(ctx, msg.EventType, msg.Payload); err != nil {
			log.Printf("skip: failed to publish event: message_id=%s err=%v", record.MessageId, err)
			continue
		}

		log.Printf("processed: message_id=%s event_type=%s", record.MessageId, msg.EventType)
	}
	return nil
}
