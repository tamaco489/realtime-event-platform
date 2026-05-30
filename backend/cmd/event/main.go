package main

import (
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/tamaco489/realtime-event-platform/backend/internal/handler/event"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

func main() {
	cfg, err := config.EventLoad()
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("service=%s started", cfg.App.ServiceName)

	h := event.NewHandler()
	lambda.Start(h.Handle)
}
