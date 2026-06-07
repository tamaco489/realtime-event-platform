package notifier

import (
	"context"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
)

// notifier は AppSync Events HTTP Publish API クライアント
type notifier struct {
	creds    aws.CredentialsProvider
	signer   *v4.Signer
	client   *http.Client
	endpoint string
	channel  string
	region   string
}

// NewNotifier は AppSync Events Publish クライアントを生成する
//
// ローカル環境ではモック実装を返す
func NewNotifier(
	ctx context.Context,
	env config.Environment,
	endpoint, channel, region string,
) (EventPublisher, error) {
	if env.IsLocal() {
		log.Println("notifier: running in mock mode")
		return &mockPublisher{}, nil
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &notifier{
		creds:    cfg.Credentials,
		signer:   v4.NewSigner(),
		client:   &http.Client{},
		endpoint: endpoint,
		channel:  channel,
		region:   region,
	}, nil
}
