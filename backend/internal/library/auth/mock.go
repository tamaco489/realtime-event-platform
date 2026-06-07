package auth

import "context"

// MockVerifier はテスト・ローカル環境用のモック実装
type MockVerifier struct {
	Claims *Claims
	Err    error
}

// Verify は設定済みの Claims と Err をそのまま返す
func (m *MockVerifier) Verify(_ context.Context, _ string) (*Claims, error) {
	return m.Claims, m.Err
}
