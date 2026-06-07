package notifier

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// eventsRequest は AppSync Events HTTP Publish API のリクエストボディ
type eventsRequest struct {
	// Channel は Publish 先のチャンネルパス
	Channel string `json:"channel"`
	// Events は Publish するイベントの JSON 文字列リスト
	Events []string `json:"events"`
}

// eventData は AppSync に Publish するイベントの本体
type eventData struct {
	// Payload はイベント固有のデータ
	Payload map[string]any `json:"payload"`
	// EventType はイベントの種別名
	EventType string `json:"event_type"`
}

// PublishEvent は指定テナント・ユーザーのチャンネルにイベントを Publish する
func (n *notifier) PublishEvent(ctx context.Context, eventType string, payload map[string]any, tenantID, userID string) error {
	edJSON, err := json.Marshal(eventData{EventType: eventType, Payload: payload})
	if err != nil {
		return fmt.Errorf("appsync: failed to marshal event: %w", err)
	}

	channel := n.channel + "/" + tenantID + "/" + userID
	body, err := json.Marshal(eventsRequest{
		Channel: channel,
		Events:  []string{string(edJSON)},
	})
	if err != nil {
		return fmt.Errorf("appsync: failed to marshal request: %w", err)
	}

	url := n.endpoint + "/event"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	creds, err := n.creds.Retrieve(ctx)
	if err != nil {
		return fmt.Errorf("appsync: failed to retrieve credentials: %w", err)
	}
	hash := sha256.Sum256(body)
	if err = n.signer.SignHTTP(ctx, creds, req, hex.EncodeToString(hash[:]), "appsync", n.region, time.Now()); err != nil {
		return fmt.Errorf("appsync: failed to sign request: %w", err)
	}

	resp, err := n.client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			log.Println(closeErr)
		}
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("appsync: failed to read response body: %w", err)
	}
	log.Printf("appsync: status=%d body=%s", resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("appsync: unexpected status %d", resp.StatusCode)
	}

	return nil
}
