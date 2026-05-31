package notifier

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// TODO: AppSync スキーマ (schema.graphql) 確定後、mutation 名・PublishEventInput 型・レスポンスフィールドを合わせて修正する
const publishEventMutation = `mutation PublishEvent($input: PublishEventInput!) { publishEvent(input: $input) { eventType } }`

type publishEventInput struct {
	Payload   map[string]any `json:"payload"`
	EventType string         `json:"eventType"`
}

type publishVariables struct {
	Input publishEventInput `json:"input"`
}

type graphQLRequest struct {
	Query     string           `json:"query"`
	Variables publishVariables `json:"variables"`
}

func (n *notifier) PublishEvent(ctx context.Context, eventType string, payload map[string]any) error {
	reqBody := graphQLRequest{
		Query: publishEventMutation,
		Variables: publishVariables{
			Input: publishEventInput{
				Payload:   payload,
				EventType: eventType,
			},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, n.endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", n.apiKey)

	resp, err := n.client.Do(req)
	if err != nil {
		return err
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Println(err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("appsync: unexpected status %d", resp.StatusCode)
	}
	return nil
}
