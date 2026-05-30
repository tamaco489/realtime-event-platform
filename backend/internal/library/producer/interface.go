package producer

import "context"

type Producer interface {
	Send(ctx context.Context, body string) error
}
