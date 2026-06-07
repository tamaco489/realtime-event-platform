package auth

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

// getKey はキャッシュから公開鍵を取得する。未キャッシュの場合は fetchKeys で取得してから返す
func (v *jwksVerifier) getKey(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	v.mu.RLock()
	key, ok := v.keySet[kid]
	v.mu.RUnlock()
	if ok {
		return key, nil
	}

	if err := v.fetchKeys(ctx); err != nil {
		return nil, err
	}

	v.mu.RLock()
	key, ok = v.keySet[kid]
	v.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("key %s not found in JWKS", kid)
	}
	return key, nil
}

// Verify は JWT の署名・有効期限を検証し、tenantId・userId を抽出して返す
func (v *jwksVerifier) Verify(ctx context.Context, token string) (*Claims, error) {
	kid, err := extractKid(token)
	if err != nil {
		return nil, err
	}

	key, err := v.getKey(ctx, kid)
	if err != nil {
		return nil, err
	}

	rawClaims, err := verifyRS256(token, key)
	if err != nil {
		return nil, err
	}

	var tenantID, userID string
	if v, ok := rawClaims["custom:tenantId"].(string); ok {
		tenantID = v
	}
	if v, ok := rawClaims["sub"].(string); ok {
		userID = v
	}

	return &Claims{TenantID: tenantID, UserID: userID}, nil
}

// extractKid は JWT ヘッダーから kid と alg を検証して kid を返す
func extractKid(token string) (string, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", errors.New("malformed token")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("decode header: %w", err)
	}

	var header struct {
		Kid string `json:"kid"`
		Alg string `json:"alg"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return "", fmt.Errorf("parse header: %w", err)
	}
	if header.Alg != "RS256" {
		return "", fmt.Errorf("unexpected alg: %s", header.Alg)
	}
	if header.Kid == "" {
		return "", errors.New("kid missing in token header")
	}
	return header.Kid, nil
}

// verifyRS256 は RS256 署名を検証し、有効期限チェック後にクレームを返す
func verifyRS256(token string, key *rsa.PublicKey) (map[string]any, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token")
	}

	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("decode signature: %w", err)
	}

	h := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if err = rsa.VerifyPKCS1v15(key, crypto.SHA256, h[:], sig); err != nil {
		return nil, fmt.Errorf("invalid signature: %w", err)
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}

	var claims map[string]any
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("parse claims: %w", err)
	}

	if exp, ok := claims["exp"].(float64); ok && time.Now().Unix() > int64(exp) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}
