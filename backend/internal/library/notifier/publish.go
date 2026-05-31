package notifier

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

const publishEventMutation = `mutation PublishEvent($input: PublishEventInput!) { publishEvent(input: $input) { event_id event_type payload created_at } }`

type publishEventInput struct {
	Payload   string `json:"payload"`
	EventType string `json:"event_type"`
}

type publishVariables struct {
	Input publishEventInput `json:"input"`
}

type graphQLRequest struct {
	Query     string           `json:"query"`
	Variables publishVariables `json:"variables"`
}

func (n *notifier) PublishEvent(ctx context.Context, eventType string, payload map[string]any) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("appsync: failed to marshal payload: %w", err)
	}

	reqBody := graphQLRequest{
		Query: publishEventMutation,
		Variables: publishVariables{
			Input: publishEventInput{
				Payload:   string(payloadJSON),
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

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("appsync: failed to read response body: %w", err)
	}
	log.Printf("appsync: status=%d body=%s", resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("appsync: unexpected status %d", resp.StatusCode)
	}

	var gqlResp struct {
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.Unmarshal(respBody, &gqlResp); err != nil {
		return fmt.Errorf("appsync: failed to parse response: %w", err)
	}
	if len(gqlResp.Errors) > 0 {
		return fmt.Errorf("appsync: graphql error: %s", gqlResp.Errors[0].Message)
	}

	return nil
}
