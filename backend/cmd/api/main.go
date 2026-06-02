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

	cfg, err := config.APILoad()
	if err != nil {
		log.Fatal(err)
	}

	p, err := producer.NewProducer(ctx, cfg.App.Env, cfg.Producer.QueueURL)
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("POST /v1/tickets/orders", api.NewHandler(p))

	log.Printf("service=%s started on :%s", cfg.App.ServiceName, cfg.App.Port)

	if err := http.ListenAndServe(":"+cfg.App.Port, corsMiddleware(mux)); err != nil {
		log.Println(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
