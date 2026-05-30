package sqs

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type publisher struct {
	client   *sqs.Client
	queueURL string
}

func NewPublisher(ctx context.Context) (Publisher, error) {
	if os.Getenv("APP_ENV") == "local" {
		log.Println("sqs publisher: running in mock mode")
		return &mockPublisher{}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &publisher{
		client:   sqs.NewFromConfig(cfg),
		queueURL: os.Getenv("SQS_QUEUE_URL"),
	}, nil
}
