package producer

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type producer struct {
	client   *sqs.Client
	queueURL string
}

func NewProducer(ctx context.Context) (Producer, error) {
	if os.Getenv("APP_ENV") == "local" {
		log.Println("sqs producer: running in mock mode")
		return &mock{}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &producer{
		client:   sqs.NewFromConfig(cfg),
		queueURL: os.Getenv("SQS_QUEUE_URL"),
	}, nil
}
