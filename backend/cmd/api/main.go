package main

import (
	"context"
	"log"
	"net/http"

	"github.com/tamaco489/realtime-event-platform/backend/internal/handler/api"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	p, err := producer.NewProducer(ctx, cfg.App.Env, cfg.Producer.QueueURL)
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("POST /events", api.NewHandler(p))

	log.Printf("service=%s started on :%s", cfg.App.ServiceName, cfg.App.Port)

	if err := http.ListenAndServe(":"+cfg.App.Port, mux); err != nil {
		log.Println(err)
	}
}
