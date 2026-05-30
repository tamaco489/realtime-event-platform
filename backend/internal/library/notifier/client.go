package notifier

import (
	"context"
	"net/http"
)

type notifier struct {
	client   *http.Client
	endpoint string
	apiKey   string
}

func NewNotifier(_ context.Context, endpoint, apiKey string) *notifier {
	return &notifier{
		client:   &http.Client{},
		endpoint: endpoint,
		apiKey:   apiKey,
	}
}
