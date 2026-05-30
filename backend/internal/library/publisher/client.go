package publisher

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/eventbridge"
)

type Client struct {
	client *eventbridge.Client
}

func New(cfg aws.Config) *Client {
	return &Client{
		client: eventbridge.NewFromConfig(cfg),
	}
}

func (c *Client) Publish(ctx context.Context) error {
	return nil
}
