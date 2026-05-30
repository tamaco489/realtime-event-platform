package store

import (
	"context"
	"log"

	lib_config "github.com/tamaco489/realtime-event-platform/backend/internal/library/config"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type store struct {
	client    *dynamodb.Client
	tableName string
}

func NewStore(ctx context.Context, env lib_config.Environment, tableName string) (EventWriter, error) {
	if env.IsLocal() {
		log.Println("store: running in mock mode")
		return &mockWriter{}, nil
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &store{
		client:    dynamodb.NewFromConfig(cfg),
		tableName: tableName,
	}, nil
}
