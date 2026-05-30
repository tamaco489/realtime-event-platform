package sqs

import "context"

type Publisher interface {
	SendMessage(ctx context.Context, body string) error
}
