package main

import (
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/tamaco489/realtime-event-platform/backend/internal/handler/authorizer"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/auth"
	"github.com/tamaco489/realtime-event-platform/backend/internal/library/config"
)

func main() {
	cfg, err := config.AuthorizerLoad()
	if err != nil {
		log.Fatal(err)
	}

	v := auth.NewVerifier(cfg.Auth.Region, cfg.Auth.UserPoolID)
	h := authorizer.NewHandler(v)

	lambda.Start(h.Handle)
}
