package store

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type store struct {
	client *dynamodb.Client
}

func NewStore(ctx context.Context) (*store, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}
	return &store{client: dynamodb.NewFromConfig(cfg)}, nil
}
