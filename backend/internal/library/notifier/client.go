package notifier

import (
	"context"
	"log"
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

type notifier struct {
	client   *http.Client
	endpoint string
	channel  string
	apiKey   string
}

func NewNotifier(
	_ context.Context,
	env config.Environment,
	endpoint, channel, apiKey string,
) (EventPublisher, error) {
	if env.IsLocal() {
		log.Println("notifier: running in mock mode")
		return &mockPublisher{}, nil
	}

	return &notifier{
		client:   &http.Client{},
		endpoint: endpoint,
		channel:  channel,
		apiKey:   apiKey,
	}, nil
}
