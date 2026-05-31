package event

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

type mockStore struct {
	err error
}

func (m *mockStore) PutEvent(_ context.Context, _ string, _ map[string]any) error {
	return m.err
}

type mockNotifier struct {
	err error
}

func (m *mockNotifier) PublishEvent(_ context.Context, _ string, _ map[string]any) error {
	return m.err
}

func TestHandler_Handle(t *testing.T) {
	t.Parallel()

	tests := map[string]struct {
		body        string
		storeErr    error
		notifierErr error
	}{
		"正常系_有効なレコードを処理できる": {
			body: `{"event_type":"user.created","payload":{"user_id":"u-001"}}`,
		},
		"異常系_不正な_JSON_をスキップする": {
			body: `{ invalid }`,
		},
		"異常系_store_エラーをスキップする": {
			body:     `{"event_type":"user.created","payload":{}}`,
			storeErr: errors.New("dynamodb error"),
		},
		"異常系_notifier_エラーをスキップする": {
			body:        `{"event_type":"user.created","payload":{}}`,
			notifierErr: errors.New("appsync error"),
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler(&mockStore{err: tt.storeErr}, &mockNotifier{err: tt.notifierErr})
			sqsEvent := events.SQSEvent{
				Records: []events.SQSMessage{
					{MessageId: "test-id", Body: tt.body},
				},
			}

			if err := h.Handle(context.Background(), sqsEvent); err != nil {
				t.Errorf("Handle() error = %v, want nil", err)
			}
		})
	}
}
