package presignup

import (
	"context"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_Handle(t *testing.T) {
	t.Parallel()

	tests := map[string]struct {
		validationData map[string]string
		wantErr        bool
		wantConfirm    bool
	}{
		"正常系_有効な_tenantId_と_companyName_でサインアップを受け付ける": {
			validationData: map[string]string{
				"tenantId":    "1234",
				"companyName": "株式会社サンプルテック",
			},
			wantErr:     false,
			wantConfirm: false,
		},
		"異常系_存在しない_tenantId_はサインアップを拒否する": {
			validationData: map[string]string{
				"tenantId":    "0000",
				"companyName": "株式会社サンプルテック",
			},
			wantErr: true,
		},
		"異常系_companyName_不一致はサインアップを拒否する": {
			validationData: map[string]string{
				"tenantId":    "1234",
				"companyName": "株式会社ダミー",
			},
			wantErr: true,
		},
		"異常系_tenantId_が空の場合はサインアップを拒否する": {
			validationData: map[string]string{
				"tenantId":    "",
				"companyName": "A社",
			},
			wantErr: true,
		},
		"異常系_companyName_が空の場合はサインアップを拒否する": {
			validationData: map[string]string{
				"tenantId":    "1234",
				"companyName": "",
			},
			wantErr: true,
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			h := NewHandler()
			event := events.CognitoEventUserPoolsPreSignup{
				Request: events.CognitoEventUserPoolsPreSignupRequest{
					ValidationData: tt.validationData,
				},
			}

			got, err := h.Handle(context.Background(), event)
			if tt.wantErr {
				if err == nil {
					t.Error("want error, got nil")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if got.Response.AutoConfirmUser != tt.wantConfirm {
				t.Errorf("AutoConfirmUser = %v, want %v", got.Response.AutoConfirmUser, tt.wantConfirm)
			}
		})
	}
}
