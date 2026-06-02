package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/tamaco489/realtime-event-platform/backend/internal/handler/event"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/notifier"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/store"
)

func main() {
	ctx := context.Background()

	cfg, err := config.EventLoad()
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("service=%s started", cfg.App.ServiceName)

	s, err := store.NewStore(ctx, cfg.App.Env, cfg.Store.TableName)
	if err != nil {
		log.Fatal(err)
	}

	n, err := notifier.NewNotifier(
		ctx,
		cfg.App.Env,
		cfg.Notifier.Endpoint,
		cfg.Notifier.Channel,
		cfg.Notifier.APIKey,
	)
	if err != nil {
		log.Fatal(err)
	}

	h := event.NewHandler(s, n)
	lambda.Start(h.Handle)
}
