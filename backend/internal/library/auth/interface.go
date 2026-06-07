package auth

import "context"

// Claims は JWT から抽出するテナント認証情報
type Claims struct {
	TenantID string
	UserID   string
}

// Verifier は JWT を検証してクレームを返すインターフェース
type Verifier interface {
	Verify(ctx context.Context, token string) (*Claims, error)
}
