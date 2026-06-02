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
			body:       `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":1,"amount":5000}`,
			wantStatus: http.StatusAccepted,
		},
		"正常系_vip席": {
			body:       `{"event_id":"evt-002","event_name":"音楽フェス 2026","seat_type":"vip","quantity":2,"amount":20000}`,
			wantStatus: http.StatusAccepted,
		},
		"異常系_不正な_JSON": {
			body:       `{ invalid }`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid JSON body",
		},
		"異常系_event_id_が空": {
			body:       `{"event_id":"","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":1,"amount":5000}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "event_id, event_name and seat_type are required",
		},
		"異常系_event_name_が空": {
			body:       `{"event_id":"evt-001","event_name":"","seat_type":"general","quantity":1,"amount":5000}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "event_id, event_name and seat_type are required",
		},
		"異常系_seat_type_が空": {
			body:       `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"","quantity":1,"amount":5000}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "event_id, event_name and seat_type are required",
		},
		"異常系_quantity_が0": {
			body:       `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":0,"amount":5000}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "quantity and amount must be greater than 0",
		},
		"異常系_amount_が0": {
			body:       `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":1,"amount":0}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "quantity and amount must be greater than 0",
		},
		"異常系_SQS_送信エラー": {
			body:        `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":1,"amount":5000}`,
			producerErr: errors.New("sqs error"),
			wantStatus:  http.StatusInternalServerError,
			wantError:   "failed to send message",
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler(&mockProducer{err: tt.producerErr})
			req := httptest.NewRequest(http.MethodPost, "/v1/tickets/orders", strings.NewReader(tt.body))
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
