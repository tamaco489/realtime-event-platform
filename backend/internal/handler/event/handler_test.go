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
		storeErr       error
		notifierErr    error
		body           string
		wantFailureIDs []string
	}{
		"正常系_有効なレコードを処理できる": {
			body: `{"event_type":"user.created","payload":{"user_id":"u-001"}}`,
		},
		"異常系_不正な_JSON_は_BatchItemFailures_に積まれる": {
			body:           `{ invalid }`,
			wantFailureIDs: []string{"test-id"},
		},
		"異常系_store_エラーは_BatchItemFailures_に積まれる": {
			body:           `{"event_type":"user.created","payload":{}}`,
			storeErr:       errors.New("dynamodb error"),
			wantFailureIDs: []string{"test-id"},
		},
		"異常系_notifier_エラーは_BatchItemFailures_に積まれる": {
			body:           `{"event_type":"user.created","payload":{}}`,
			notifierErr:    errors.New("appsync error"),
			wantFailureIDs: []string{"test-id"},
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

			resp, err := h.Handle(context.Background(), sqsEvent)
			if err != nil {
				t.Errorf("Handle() error = %v, want nil", err)
			}

			if len(resp.BatchItemFailures) != len(tt.wantFailureIDs) {
				t.Errorf("BatchItemFailures len = %d, want %d", len(resp.BatchItemFailures), len(tt.wantFailureIDs))
				return
			}

			for i, id := range tt.wantFailureIDs {
				if resp.BatchItemFailures[i].ItemIdentifier != id {
					t.Errorf("BatchItemFailures[%d] = %q, want %q", i, resp.BatchItemFailures[i].ItemIdentifier, id)
				}
			}
		})
	}
}
