package authorizer

import (
	"context"
	"log"
	"strings"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/auth"
)

// 5 分キャッシュ
const authzCacheTTLSec = 300

type Handler struct {
	verifier auth.Verifier
}

func NewHandler(v auth.Verifier) *Handler {
	return &Handler{verifier: v}
}

// DOC: https://docs.aws.amazon.com/appsync/latest/eventapi/configure-event-api-auth.html
//
// Request は AppSync Events Lambda Authorizer が受け取るイベント
type Request struct {
	RequestHeaders     map[string]string `json:"requestHeaders"`
	AuthorizationToken string            `json:"authorizationToken"`
	RequestContext     requestContext    `json:"requestContext"`
}

// DOC: https://docs.aws.amazon.com/appsync/latest/eventapi/configure-event-api-auth.html
//
// Response は AppSync Events Lambda Authorizer が返すレスポンス
type Response struct {
	IsAuthorized bool `json:"isAuthorized"`
	TTLOverride  int  `json:"ttlOverride"`
}

type requestContext struct {
	APIId                string `json:"apiId"`
	AccountID            string `json:"accountId"`
	RequestID            string `json:"requestId"`
	Operation            string `json:"operation"`
	ChannelNamespaceName string `json:"channelNamespaceName"`
	Channel              string `json:"channel"`
}

// Handle は AppSync Events Lambda Authorizer のエントリポイント
//   - クライアントが WebSocket で Subscribe する際に AppSync から呼び出され、チャンネルへのアクセス可否を判定。
//   - JWT を Cognito JWKS で検証し、チャンネルパスの tenantId, userId と claims を照合する。
//   - 承認時は TTLOverride: 300 (5 分) でキャッシュする。
func (h *Handler) Handle(ctx context.Context, req Request) (Response, error) {
	token := strings.TrimPrefix(req.AuthorizationToken, "Bearer ")

	claims, err := h.verifier.Verify(ctx, token)
	if err != nil {
		log.Printf("auth: token verification failed: %v", err)
		return Response{
			IsAuthorized: false,
			TTLOverride:  0,
		}, nil
	}

	// チャンネルパス /tickets/orders/{tenantId}/{userId} を "/" で分割して tenantId・userId を抽出する
	segments := h.splitChannelPath(req.RequestContext.Channel)
	const minSegments = 4
	if len(segments) < minSegments {
		log.Printf("auth: channel path too short: %s", req.RequestContext.Channel)
		return Response{
			IsAuthorized: false,
			TTLOverride:  0,
		}, nil
	}

	// チャンネルパスの tenantId, userId と JWT claims を照合する
	const idxTenantID, idxUserID = 2, 3
	tenantID, userID := segments[idxTenantID], segments[idxUserID]
	if claims.TenantID != tenantID || claims.UserID != userID {
		log.Printf("auth: tenant/user mismatch: jwt=%s/%s channel=%s/%s",
			claims.TenantID, claims.UserID, tenantID, userID)
		return Response{
			IsAuthorized: false,
			TTLOverride:  0,
		}, nil
	}

	return Response{
		IsAuthorized: true,
		TTLOverride:  authzCacheTTLSec,
	}, nil
}

// splitChannelPath はチャンネルパスを "/" で分割する
//   - input:  "/tickets/orders/tenant-abc/user-123"
//   - output: ["tickets", "orders", "tenant-abc", "user-123"]
func (h *Handler) splitChannelPath(channel string) []string {
	return strings.FieldsFunc(
		channel,
		func(r rune) bool { return r == '/' },
	)
}
