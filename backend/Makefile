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
	$(BUILD_OPTS) go build -trimpath -o build/authorizer/bootstrap ./cmd/authorizer
	$(BUILD_OPTS) go build -trimpath -o build/presignup/bootstrap ./cmd/presignup

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


EVENT_FILE  ?= tools/events/sqs_event.json

.PHONY: run-event invoke-event
run-event:
	_LAMBDA_SERVER_PORT=9000 APP_ENV=local EVENT_SERVICE_NAME=realtime-event-lambda go run ./cmd/event

invoke-event:
	emulator -event $(EVENT_FILE)


S3_BUCKET   ?= $(ENV)-realtime-event-storage

.PHONY: upload-api upload-event upload-authorizer upload-presignup upload
upload-api:
	$(BUILD_OPTS) go build -trimpath -o build/api/bootstrap ./cmd/api
	zip -j build/api/bootstrap.zip build/api/bootstrap
	aws s3 cp build/api/bootstrap.zip s3://$(S3_BUCKET)/artifacts/api/bootstrap.zip --profile $(AWS_PROFILE)

upload-event:
	$(BUILD_OPTS) go build -trimpath -o build/event/bootstrap ./cmd/event
	zip -j build/event/bootstrap.zip build/event/bootstrap
	aws s3 cp build/event/bootstrap.zip s3://$(S3_BUCKET)/artifacts/event/bootstrap.zip --profile $(AWS_PROFILE)

upload-authorizer:
	$(BUILD_OPTS) go build -trimpath -o build/authorizer/bootstrap ./cmd/authorizer
	zip -j build/authorizer/bootstrap.zip build/authorizer/bootstrap
	aws s3 cp build/authorizer/bootstrap.zip s3://$(S3_BUCKET)/artifacts/authorizer/bootstrap.zip --profile $(AWS_PROFILE)

upload-presignup:
	$(BUILD_OPTS) go build -trimpath -o build/presignup/bootstrap ./cmd/presignup
	zip -j build/presignup/bootstrap.zip build/presignup/bootstrap
	aws s3 cp build/presignup/bootstrap.zip s3://$(S3_BUCKET)/artifacts/presignup/bootstrap.zip --profile $(AWS_PROFILE)

upload: upload-api upload-event upload-authorizer upload-presignup


.PHONY: deploy-api deploy-event deploy-authorizer deploy-presignup
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

deploy-authorizer: upload-authorizer
	aws lambda update-function-code \
		--function-name $(ENV)-realtime-event-appsync-authorizer \
		--s3-bucket $(S3_BUCKET) \
		--s3-key artifacts/authorizer/bootstrap.zip \
		--profile $(AWS_PROFILE) | jq .

deploy-presignup: upload-presignup
	aws lambda update-function-code \
		--function-name $(ENV)-realtime-event-presignup \
		--s3-bucket $(S3_BUCKET) \
		--s3-key artifacts/presignup/bootstrap.zip \
		--profile $(AWS_PROFILE) | jq .

deploy: deploy-api deploy-event deploy-authorizer deploy-presignup
