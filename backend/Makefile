BUILD_OPTS   = GOOS=linux GOARCH=arm64 CGO_ENABLED=0
AWS_PROFILE ?= default
ENV         ?= prd

.PHONY: setup-tools
setup-tools:
	go install github.com/tamaco489/lambda-emulator/cmd/emulator@latest


.PHONY: fmt lint mod build test verify
fmt:
	go fmt ./...

mod: fmt
	go mod tidy

build: mod
	$(BUILD_OPTS) go build -trimpath -o build/api/bootstrap ./cmd/api
	$(BUILD_OPTS) go build -trimpath -o build/event/bootstrap ./cmd/event

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


S3_BUCKET   ?= $(ENV)-realtime-event-storage

.PHONY: upload-api upload-event upload update-api update-event
upload-api:
	$(BUILD_OPTS) go build -trimpath -o build/api/bootstrap ./cmd/api
	zip -j build/api/bootstrap.zip build/api/bootstrap
	aws s3 cp build/api/bootstrap.zip s3://$(S3_BUCKET)/artifacts/api/bootstrap.zip --profile $(AWS_PROFILE)

upload-event:
	$(BUILD_OPTS) go build -trimpath -o build/event/bootstrap ./cmd/event
	zip -j build/event/bootstrap.zip build/event/bootstrap
	aws s3 cp build/event/bootstrap.zip s3://$(S3_BUCKET)/artifacts/event/bootstrap.zip --profile $(AWS_PROFILE)

upload: upload-api upload-event

deploy-api: upload-api
	aws lambda update-function-code \
		--function-name $(ENV)-realtime-event-api \
		--s3-bucket $(S3_BUCKET) \
		--s3-key artifacts/api/bootstrap.zip \
		--profile $(AWS_PROFILE) | jq .

deploy-event: upload-event
	aws lambda update-function-code \
		--function-name $(ENV)-realtime-event-event \
		--s3-bucket $(S3_BUCKET) \
		--s3-key artifacts/event/bootstrap.zip \
		--profile $(AWS_PROFILE) | jq .
