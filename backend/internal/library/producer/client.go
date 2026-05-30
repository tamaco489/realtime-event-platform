package producer

import (
	"context"
	"log"

	lib_config "github.com/tamaco489/realtime-event-platform/backend/internal/library/config"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type producer struct {
	client   *sqs.Client
	queueURL string
}

func NewProducer(ctx context.Context, env lib_config.Environment, queueURL string) (Producer, error) {
	if env.IsLocal() {
		log.Println("sqs producer: running in mock mode")
		return &mock{}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &producer{
		client:   sqs.NewFromConfig(cfg),
		queueURL: queueURL,
	}, nil
}
