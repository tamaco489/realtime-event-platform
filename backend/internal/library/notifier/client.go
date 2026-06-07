package notifier

import (
	"context"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"

	lib_config "github.com/aws/aws-sdk-go-v2/config"

	signer "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

type notifier struct {
	creds    aws.CredentialsProvider
	signer   *signer.Signer
	client   *http.Client
	endpoint string
	channel  string
	region   string
}

func NewNotifier(
	ctx context.Context,
	env config.Environment,
	endpoint, channel, region string,
) (EventPublisher, error) {
	if env.IsLocal() {
		log.Println("notifier: running in mock mode")
		return &mockPublisher{}, nil
	}

	cfg, err := lib_config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &notifier{
		creds:    cfg.Credentials,
		signer:   signer.NewSigner(),
		client:   &http.Client{},
		endpoint: endpoint,
		channel:  channel,
		region:   region,
	}, nil
}
