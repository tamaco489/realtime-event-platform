package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/auth"
)

type mockProducer struct {
	err error
}

func (m *mockProducer) Send(_ context.Context, _ string) error {
	return m.err
}

// validClaims は正常系テストで使う固定クレーム
var validClaims = &auth.Claims{TenantID: "tenant-xxx01", UserID: "user-001"}

func TestHandler_ServeHTTP_Auth(t *testing.T) {
	t.Parallel()

	validBody := `{"event_id":"evt-001","event_name":"技術カンファレンス 2026","seat_type":"general","quantity":1,"amount":5000}`

	tests := map[string]struct {
		mockClaims  *auth.Claims
		mockAuthErr error
		authHeader  string
		wantError   string
		wantStatus  int
	}{
		"異常系_Authorization_ヘッダーなし": {
			authHeader: "",
			wantStatus: http.StatusUnauthorized,
			wantError:  "authorization header is required",
		},
		"異常系_Bearer_プレフィックスなし": {
			authHeader: "invalid-token",
			wantStatus: http.StatusUnauthorized,
			wantError:  "authorization header must be Bearer token",
		},
		"異常系_Bearer_のみでトークンなし": {
			authHeader: "Bearer ",
			wantStatus: http.StatusUnauthorized,
			wantError:  "authorization header must be Bearer token",
		},
		"異常系_JWT_検証エラー": {
			authHeader:  "Bearer bad.token.here",
			mockAuthErr: errors.New("invalid signature"),
			wantStatus:  http.StatusUnauthorized,
			wantError:   "invalid or expired token",
		},
		"異常系_tenantId_が空": {
			authHeader: "Bearer valid.token.here",
			mockClaims: &auth.Claims{TenantID: "", UserID: "user-001"},
			wantStatus: http.StatusForbidden,
			wantError:  "tenantId or userId missing in token",
		},
		"異常系_userId_が空": {
			authHeader: "Bearer valid.token.here",
			mockClaims: &auth.Claims{TenantID: "tenant-xxx01", UserID: ""},
			wantStatus: http.StatusForbidden,
			wantError:  "tenantId or userId missing in token",
		},
		"正常系_有効な_JWT": {
			authHeader: "Bearer valid.token.here",
			mockClaims: validClaims,
			wantStatus: http.StatusAccepted,
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			v := &auth.MockVerifier{Claims: tt.mockClaims, Err: tt.mockAuthErr}
			h := NewHandler(&mockProducer{}, v, false)
			req := httptest.NewRequest(http.MethodPost, "/v1/tickets/orders", strings.NewReader(validBody))
			req.Header.Set("Content-Type", "application/json")
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			w := httptest.NewRecorder()

			h.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.wantError != "" {
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

			// isLocal=true でリクエストボディのみをテストする
			h := NewHandler(&mockProducer{err: tt.producerErr}, nil, true)
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
