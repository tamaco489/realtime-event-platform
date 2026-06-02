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

type eventsRequest struct {
	Events []string `json:"events"`
}

type eventData struct {
	Payload   map[string]any `json:"payload"`
	EventType string         `json:"event_type"`
}

func (n *notifier) PublishEvent(ctx context.Context, eventType string, payload map[string]any) error {
	edJSON, err := json.Marshal(eventData{EventType: eventType, Payload: payload})
	if err != nil {
		return fmt.Errorf("appsync: failed to marshal event: %w", err)
	}

	body, err := json.Marshal(eventsRequest{Events: []string{string(edJSON)}})
	if err != nil {
		return fmt.Errorf("appsync: failed to marshal request: %w", err)
	}

	url := n.endpoint + "/event/" + n.channel
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
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
