package auth

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

var testRSAKey *rsa.PrivateKey

func TestMain(m *testing.M) {
	var err error
	testRSAKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}
	os.Exit(m.Run())
}

// buildSignedJWT は RS256 署名付き JWT を生成する
func buildSignedJWT(t *testing.T, key *rsa.PrivateKey, kid string, payload map[string]any) string {
	t.Helper()

	headerJSON, err := json.Marshal(map[string]string{"kid": kid, "alg": "RS256"})
	if err != nil {
		t.Fatal(err)
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}

	header := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadEnc := base64.RawURLEncoding.EncodeToString(payloadJSON)

	sigInput := header + "." + payloadEnc
	h := sha256.Sum256([]byte(sigInput))

	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, h[:])
	if err != nil {
		t.Fatal(err)
	}

	return sigInput + "." + base64.RawURLEncoding.EncodeToString(sig)
}

// buildRawJWT はカスタムヘッダーで JWT を生成する (署名検証不要なテスト用)
func buildRawJWT(t *testing.T, header, payload map[string]any, sig string) string {
	t.Helper()

	headerJSON, err := json.Marshal(header)
	if err != nil {
		t.Fatal(err)
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	h := base64.RawURLEncoding.EncodeToString(headerJSON)
	p := base64.RawURLEncoding.EncodeToString(payloadJSON)
	return h + "." + p + "." + sig
}

func Test_extractKid(t *testing.T) {
	t.Parallel()

	validToken := buildSignedJWT(t, testRSAKey, "key-1", map[string]any{"sub": "user-1"})

	tests := map[string]struct {
		token   string
		wantKid string
		wantErr string
	}{
		"正常系_有効なヘッダーから_kid_を抽出する": {
			token:   validToken,
			wantKid: "key-1",
		},
		"異常系_3_パート未満のトークンはエラーを返す": {
			token:   "a.b",
			wantErr: "malformed token",
		},
		"異常系_ヘッダーが_base64_デコードできない場合はエラーを返す": {
			token:   "!!!invalid!!!.payload.sig",
			wantErr: "decode header",
		},
		"異常系_RS256_以外のアルゴリズムはエラーを返す": {
			token:   buildRawJWT(t, map[string]any{"kid": "k", "alg": "HS256"}, map[string]any{}, "sig"),
			wantErr: "unexpected alg",
		},
		"異常系_kid_が空の場合はエラーを返す": {
			token:   buildRawJWT(t, map[string]any{"kid": "", "alg": "RS256"}, map[string]any{}, "sig"),
			wantErr: "kid missing",
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			got, err := extractKid(tt.token)
			if tt.wantErr != "" {
				if err == nil {
					t.Fatalf("want error containing %q, got nil", tt.wantErr)
				}
				if !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("error = %q, want to contain %q", err.Error(), tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.wantKid {
				t.Errorf("kid = %q, want %q", got, tt.wantKid)
			}
		})
	}
}

func Test_verifyRS256(t *testing.T) {
	t.Parallel()

	future := time.Now().Add(time.Hour).Unix()
	past := time.Now().Add(-time.Hour).Unix()

	validToken := buildSignedJWT(t, testRSAKey, "k1", map[string]any{
		"sub": "user-1", "custom:tenantId": "tenant-1", "exp": future,
	})

	parts := strings.SplitN(validToken, ".", 3)
	tamperedToken := parts[0] + "." + parts[1] + "." + base64.RawURLEncoding.EncodeToString(make([]byte, 256))

	tests := map[string]struct {
		token   string
		key     *rsa.PublicKey
		wantErr string
	}{
		"正常系_有効な署名と有効期限のトークンは_claims_を返す": {
			token: validToken,
			key:   &testRSAKey.PublicKey,
		},
		"異常系_期限切れトークンはエラーを返す": {
			token:   buildSignedJWT(t, testRSAKey, "k1", map[string]any{"exp": past}),
			key:     &testRSAKey.PublicKey,
			wantErr: "token expired",
		},
		"異常系_改ざんされた署名はエラーを返す": {
			token:   tamperedToken,
			key:     &testRSAKey.PublicKey,
			wantErr: "invalid signature",
		},
		"異常系_3_パート未満のトークンはエラーを返す": {
			token:   "a.b",
			key:     &testRSAKey.PublicKey,
			wantErr: "malformed token",
		},
	}

	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			_, err := verifyRS256(tt.token, tt.key)
			if tt.wantErr != "" {
				if err == nil {
					t.Fatalf("want error containing %q, got nil", tt.wantErr)
				}
				if !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("error = %q, want to contain %q", err.Error(), tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
