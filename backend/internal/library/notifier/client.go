package notifier

import (
	"context"
	"log"
	"net/http"

	lib_config "github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

type notifier struct {
	client   *http.Client
	endpoint string
	apiKey   string
}

func NewNotifier(_ context.Context, env lib_config.Environment, endpoint, apiKey string) (EventPublisher, error) {
	if env.IsLocal() {
		log.Println("notifier: running in mock mode")
		return &mockPublisher{}, nil
	}

	return &notifier{
		client:   &http.Client{},
		endpoint: endpoint,
		apiKey:   apiKey,
	}, nil
}
