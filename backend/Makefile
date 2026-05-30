BUILD_OPTS = GOOS=linux GOARCH=arm64 CGO_ENABLED=0

.PHONY: up fmt lint mod test build build-api build-event verify

up:
	go run ./cmd/api

fmt:
	go fmt ./...

lint:
	golangci-lint run ./...

mod:
	go mod tidy
	git diff --exit-code go.mod go.sum

test:
	go test -race ./...

build-api:
	$(BUILD_OPTS) go build -trimpath -o build/api ./cmd/api

build-event:
	$(BUILD_OPTS) go build -trimpath -o build/event ./cmd/event

build: build-api build-event

verify: fmt lint build test
