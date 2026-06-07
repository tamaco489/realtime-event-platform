package event

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
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

// eventMessage は SQS から受け取るメッセージ構造
type eventMessage struct {
	Payload   map[string]any `json:"payload"`
	EventType string         `json:"event_type"`
	TenantID  string         `json:"tenant_id"`
	UserID    string         `json:"user_id"`
}

// Handle は SQS イベントを受け取り、各レコードを処理する
//
// 失敗したレコードはパーシャルバッチ失敗として BatchItemFailures に積み、DLQ へ転送する
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

// processRecord は SQS の単一レコードを処理する
func (h *Handler) processRecord(ctx context.Context, record events.SQSMessage) error {
	var msg eventMessage
	if err := json.Unmarshal([]byte(record.Body), &msg); err != nil {
		return err
	}

	// tenant_id または user_id が欠如している場合はエラーを返す
	if err := msg.validate(record.MessageId); err != nil {
		return err
	}

	// NOTE: イベントの処理に時間がかかるケースを想定して、敢えて Sleep で遅延させている
	time.Sleep(3 * time.Second)

	// UUID v7 を order_id として生成
	orderID, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("failed to generate order_id: %w", err)
	}

	// DynamoDB に状態を保存
	if err = h.store.PutEvent(ctx, msg.TenantID, msg.UserID, orderID.String(), msg.EventType, msg.Payload); err != nil {
		return err
	}

	// AppSync にイベントを Publish
	publishPayload := map[string]any{
		"order_id": "ord-" + orderID.String(),
		"status":   "confirmed",
	}
	if err = h.notifier.PublishEvent(ctx, msg.EventType, publishPayload, msg.TenantID, msg.UserID); err != nil {
		return err
	}

	log.Printf("processed: message_id=%s event_type=%s tenant_id=%s user_id=%s", record.MessageId, msg.EventType, msg.TenantID, msg.UserID)
	return nil
}

// validate は tenant_id または user_id が欠如している場合にエラーを返す
func (m *eventMessage) validate(messageID string) error {
	if m.TenantID == "" || m.UserID == "" {
		return fmt.Errorf("tenant_id or user_id is missing: message_id=%s", messageID)
	}
	return nil
}
