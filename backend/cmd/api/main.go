package main

import (
	"context"
	"log"
	"net/http"
	"os"

	api "github.com/tamaco489/realtime-event-platform/backend/internal/handler/api"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/producer"
)

func main() {
	ctx := context.Background()

	p, err := producer.NewProducer(ctx)
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("POST /events", api.NewHandler(p))

	port, serviceName := os.Getenv("APP_PORT"), os.Getenv("API_SERVICE_NAME")
	log.Printf("service=%s started on :%s", serviceName, port)

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Println(err)
	}
}
