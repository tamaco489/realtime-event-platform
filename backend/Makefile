BUILD_OPTS = GOOS=linux GOARCH=arm64 CGO_ENABLED=0

.PHONY: setup-tools
setup-tools:
	go install github.com/tamaco489/lambda-emulator/cmd/emulator@latest


.PHONY: fmt lint mod build build-api build-event test verify
fmt:
	go fmt ./...

mod: fmt
	go mod tidy

build: mod
	$(BUILD_OPTS) go build -trimpath -o build/api ./cmd/api
	$(BUILD_OPTS) go build -trimpath -o build/event ./cmd/event

lint:
	golangci-lint run ./...

test:
	go test ./... -race -v

verify: build lint test


.PHONY: up down logs
up:
	docker compose up -d api

down:
	docker compose down api

logs:
	docker compose logs -f api


.PHONY: run-event
run-event:
	_LAMBDA_SERVER_PORT=9000 APP_ENV=local EVENT_SERVICE_NAME=realtime-event-lambda go run ./cmd/event
