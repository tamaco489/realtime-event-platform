package authorizer

import (
	"context"
	"errors"
	"testing"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/auth"
)

func TestHandler_Handle(t *testing.T) {
	t.Parallel()

	validClaims := &auth.Claims{
		TenantID: "tenant-abc",
		UserID:   "user-123",
	}

	tests := map[string]struct {
		mockClaims  *auth.Claims
		mockAuthErr error
		token       string
		operation   string
		channel     string
		wantAuth    bool
		wantTTL     int
	}{
		"正常系_EventConnect_で有効な_JWT_なら承認する": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_CONNECT",
			channel:    "",
			mockClaims: validClaims,
			wantAuth:   true,
			wantTTL:    authzCacheTTLSec,
		},
		"異常系_EventConnect_で_JWT_検証エラーは_isAuthorized_false_を返す": {
			token:       "Bearer bad.token.here",
			operation:   "EventConnect",
			channel:     "",
			mockAuthErr: errors.New("invalid signature"),
			wantAuth:    false,
			wantTTL:     0,
		},
		"正常系_EventSubscribe_で有効な_JWT_とチャンネルパスが一致すれば承認する": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/tenant-abc/user-123",
			mockClaims: validClaims,
			wantAuth:   true,
			wantTTL:    authzCacheTTLSec,
		},
		"異常系_EventSubscribe_で_JWT_検証エラーは_isAuthorized_false_を返す": {
			token:       "Bearer bad.token.here",
			operation:   "EventSubscribe",
			channel:     "/tickets/orders/tenant-abc/user-123",
			mockAuthErr: errors.New("invalid signature"),
			wantAuth:    false,
			wantTTL:     0,
		},
		"異常系_EventSubscribe_でチャンネルパスのセグメントが不足している場合は_isAuthorized_false_を返す": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/tenant-abc",
			mockClaims: validClaims,
			wantAuth:   false,
			wantTTL:    0,
		},
		"異常系_EventSubscribe_で_tenantId_不一致は_isAuthorized_false_を返す": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/other-tenant/user-123",
			mockClaims: validClaims,
			wantAuth:   false,
			wantTTL:    0,
		},
		"異常系_EventSubscribe_で_userId_不一致は_isAuthorized_false_を返す": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/tenant-abc/other-user",
			mockClaims: validClaims,
			wantAuth:   false,
			wantTTL:    0,
		},
		"異常系_EventSubscribe_で_claims_の_tenantId_が空の場合は_isAuthorized_false_を返す": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/tenant-abc/user-123",
			mockClaims: &auth.Claims{TenantID: "", UserID: "user-123"},
			wantAuth:   false,
			wantTTL:    0,
		},
		"異常系_EventSubscribe_で_claims_の_userId_が空の場合は_isAuthorized_false_を返す": {
			token:      "Bearer valid.token.here",
			operation:  "EVENT_SUBSCRIBE",
			channel:    "/tickets/orders/tenant-abc/user-123",
			mockClaims: &auth.Claims{TenantID: "tenant-abc", UserID: ""},
			wantAuth:   false,
			wantTTL:    0,
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler(&auth.MockVerifier{Claims: tt.mockClaims, Err: tt.mockAuthErr})
			req := Request{
				AuthorizationToken: tt.token,
				RequestContext: requestContext{
					Operation: tt.operation,
					Channel:   tt.channel,
				},
			}

			resp, err := h.Handle(context.Background(), req)
			if err != nil {
				t.Errorf("Handle() error = %v, want nil", err)
			}
			if resp.IsAuthorized != tt.wantAuth {
				t.Errorf("IsAuthorized = %v, want %v", resp.IsAuthorized, tt.wantAuth)
			}
			if resp.TTLOverride != tt.wantTTL {
				t.Errorf("TTLOverride = %d, want %d", resp.TTLOverride, tt.wantTTL)
			}
		})
	}
}
