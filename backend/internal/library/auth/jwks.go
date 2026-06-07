package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"sync"
	"time"
)

// jwk は JWKS エンドポイントから取得する JSON Web Key の単一エントリ
type jwk struct {
	Kid string `json:"kid"` // 鍵識別子。JWT ヘッダーの kid と照合して対応する公開鍵を特定する
	Alg string `json:"alg"` // 署名アルゴリズム (例: "RS256")
	N   string `json:"n"`   // RSA 公開鍵の modulus (Base64URL エンコード)
	E   string `json:"e"`   // RSA 公開鍵の exponent (Base64URL エンコード)
}

// jwks は JWKS エンドポイントのレスポンス全体
type jwks struct {
	Keys []jwk `json:"keys"` // 公開鍵の一覧
}

// jwksVerifier は JWKS をキャッシュして JWT を検証する実装
type jwksVerifier struct {
	keySet  map[string]*rsa.PublicKey // kid をキーとする公開鍵キャッシュ
	jwksURL string                    // JWKS 取得先 URL
	mu      sync.RWMutex              // keySet への並行アクセスを保護する
}

// NewVerifier は JWKS エンドポイントを使って JWT を検証する Verifier を返す
func NewVerifier(region, userPoolID string) Verifier {
	return &jwksVerifier{
		jwksURL: fmt.Sprintf("https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json", region, userPoolID),
		keySet:  make(map[string]*rsa.PublicKey),
	}
}

// fetchKeys は JWKS エンドポイントから公開鍵を取得してキャッシュに格納する
func (v *jwksVerifier) fetchKeys(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return fmt.Errorf("create JWKS request: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("fetch JWKS: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	var set jwks
	if err := json.NewDecoder(resp.Body).Decode(&set); err != nil {
		return fmt.Errorf("decode JWKS: %w", err)
	}

	v.mu.Lock()
	defer v.mu.Unlock()
	for _, k := range set.Keys {
		pub, err := parseJWK(k)
		if err != nil {
			continue
		}
		v.keySet[k.Kid] = pub
	}
	return nil
}

// parseJWK は JWK の n・e フィールドから RSA 公開鍵を生成する
func parseJWK(k jwk) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, fmt.Errorf("decode n: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, fmt.Errorf("decode e: %w", err)
	}
	return &rsa.PublicKey{
		N: new(big.Int).SetBytes(nBytes),
		E: int(new(big.Int).SetBytes(eBytes).Int64()),
	}, nil
}
