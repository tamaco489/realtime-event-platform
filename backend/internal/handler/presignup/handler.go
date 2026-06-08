package presignup

import (
	"context"
	"errors"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

type tenant struct {
	companyName string
}

// tenants はテナント定義。tenantId をキー、企業名を値として照合する
var tenants = map[string]tenant{
	"1234": {companyName: "株式会社サンプルテック"},
	"5678": {companyName: "合同会社フューチャーワークス"},
}

// Handler は Cognito Pre Sign-up Lambda のハンドラ
type Handler struct{}

// NewHandler は Handler を返す
func NewHandler() *Handler {
	return &Handler{}
}

// Handle は Cognito Pre Sign-up トリガーのエントリポイント
//   - validationData から tenantId と companyName を取得し、テナント定義と照合する。
//   - 両方一致した場合のみサインアップを受け付け、autoConfirmUser: false を返す。
func (h *Handler) Handle(ctx context.Context, event events.CognitoEventUserPoolsPreSignup) (events.CognitoEventUserPoolsPreSignup, error) {
	tenantID := event.Request.ValidationData["tenantId"]
	companyName := event.Request.ValidationData["companyName"]

	// NOTE: 本来は顧客マスタ (DynamoDB / RDB 等) からテナント定義を取得して照合する。
	// コスト削減のため、本実装ではテナント定義を Lambda コード内にハードコードしている。
	// テナントまたは会社名が一致しない場合はサインアップを拒否し、Cognito がクライアントに PreSignUpFailed を返す。
	if err := h.validate(tenantID, companyName); err != nil {
		return event, fmt.Errorf("signup rejected: %w", err)
	}

	// false を明示することで、管理者が custom:tenantId を付与するまでユーザーが待機状態になる意図を示す
	event.Response.AutoConfirmUser = false

	return event, nil
}

func (h *Handler) validate(tenantID, companyName string) error {
	if tenantID == "" || companyName == "" {
		return errors.New("tenantId and companyName are required")
	}

	t, ok := tenants[tenantID]
	if !ok {
		return fmt.Errorf("tenant not found: %s", tenantID)
	}

	if t.companyName != companyName {
		return fmt.Errorf("company name mismatch for tenant: %s", tenantID)
	}

	return nil
}
