package event

import (
	"context"
	"encoding/json"
	"log"
	"time"

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

func (h *Handler) Handle(ctx context.Context, sqsEvent events.SQSEvent) (events.SQSEventResponse, error) {
	log.Printf("event handler invoked: records=%d", len(sqsEvent.Records))

	var resp events.SQSEventResponse

	for _, record := range sqsEvent.Records {
		if err := h.processRecord(ctx, record); err != nil {
			log.Printf("failure: message_id=%s err=%v", record.MessageId, err)
			// パーシャルバッチ失敗: 失敗レコードの messageId だけを BatchItemFailures に積む
			// SQS はこのリストを見て失敗レコードのみ再試行し、成功レコードはキューから削除する
			// 再試行が maxReceiveCount を超えたレコードだけ DLQ に移動する
			resp.BatchItemFailures = append(resp.BatchItemFailures, events.SQSBatchItemFailure{
				ItemIdentifier: record.MessageId,
			})
		}
	}

	return resp, nil
}

func (h *Handler) processRecord(ctx context.Context, record events.SQSMessage) error {
	var msg eventMessage
	if err := json.Unmarshal([]byte(record.Body), &msg); err != nil {
		return err
	}

	// NOTE: イベントの処理に時間がかかるケースを想定して、敢えて Sleep で遅延させている
	time.Sleep(3 * time.Second)

	if err := h.store.PutEvent(ctx, msg.EventType, msg.Payload); err != nil {
		return err
	}

	if err := h.notifier.PublishEvent(ctx, msg.EventType, msg.Payload); err != nil {
		return err
	}

	log.Printf("processed: message_id=%s event_type=%s", record.MessageId, msg.EventType)
	return nil
}
