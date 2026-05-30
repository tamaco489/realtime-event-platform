BUILD_OPTS = GOOS=linux GOARCH=arm64 CGO_ENABLED=0

.PHONY: fmt lint mod build build-api build-event verify
fmt:
	go fmt ./...

mod: fmt
	go mod tidy

build: mod
	$(BUILD_OPTS) go build -trimpath -o build/api ./cmd/api
	$(BUILD_OPTS) go build -trimpath -o build/event ./cmd/event

lint:
	golangci-lint run ./...

verify: build lint


.PHONY: up down logs
up:
	docker compose up -d api

down:
	docker compose down api

logs:
	docker compose logs -f api
