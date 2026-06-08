package main

import (
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/tamaco489/realtime-event-platform/backend/internal/handler/presignup"
)

func main() {
	h := presignup.NewHandler()
	lambda.Start(h.Handle)
}
