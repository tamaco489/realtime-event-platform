package producer

import (
	"context"
	"log"

	aws_config "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

type producer struct {
	client   *sqs.Client
	queueURL string
}

func NewProducer(ctx context.Context, env config.Environment, queueURL string) (Producer, error) {
	if env.IsLocal() {
		log.Println("sqs producer: running in mock mode")
		return &mock{}, nil
	}

	cfg, err := aws_config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &producer{
		client:   sqs.NewFromConfig(cfg),
		queueURL: queueURL,
	}, nil
}
