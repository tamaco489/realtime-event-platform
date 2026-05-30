package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type mockProducer struct {
	err error
}

func (m *mockProducer) Send(_ context.Context, _ string) error {
	return m.err
}

func TestHandler_ServeHTTP(t *testing.T) {
	t.Parallel()

	tests := map[string]struct {
		body        string
		producerErr error
		wantError   string
		wantStatus  int
	}{
		"正常系_有効なリクエスト": {
			body:       `{"event_type":"test","payload":{}}`,
			wantStatus: http.StatusAccepted,
		},
		"正常系_payload_にデータを含む": {
			body:       `{"event_type":"user.created","payload":{"user_id":"u-001"}}`,
			wantStatus: http.StatusAccepted,
		},
		"異常系_不正な_JSON": {
			body:       `{ invalid }`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid JSON body",
		},
		"異常系_event_type_が空": {
			body:       `{"event_type":"","payload":{}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "event_type is required",
		},
		"異常系_event_type_が欠落": {
			body:       `{"payload":{}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "event_type is required",
		},
		"異常系_SQS_送信エラー": {
			body:        `{"event_type":"test","payload":{}}`,
			producerErr: errors.New("sqs error"),
			wantStatus:  http.StatusInternalServerError,
			wantError:   "failed to send message",
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler(&mockProducer{err: tt.producerErr})
			req := httptest.NewRequest(http.MethodPost, "/events", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			h.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.wantError != "" {
				if ct := w.Header().Get("Content-Type"); ct != "application/json" {
					t.Errorf("Content-Type = %q, want %q", ct, "application/json")
				}
				var resp map[string]string
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Fatalf("failed to decode response body: %v", err)
				}
				if resp["error"] != tt.wantError {
					t.Errorf("error = %q, want %q", resp["error"], tt.wantError)
				}
			}
		})
	}
}
