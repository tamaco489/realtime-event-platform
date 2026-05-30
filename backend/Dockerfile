# ---- Lambda Web Adapter ----
FROM public.ecr.aws/awsguru/aws-lambda-adapter:v1.0.0 AS lambda-adapter

# ---- Build ----
FROM golang:1.26.3-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bootstrap ./cmd/api

# ---- Runtime ----
FROM alpine:latest
COPY --from=lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter
COPY --from=builder /app/bootstrap /var/task/bootstrap
EXPOSE 8080
CMD ["/var/task/bootstrap"]
