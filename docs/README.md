# realtime-event-platform

> 日本語版: [README.ja.md](README.ja.md)

## Overview

Reference implementation of an event-driven architecture using AWS AppSync Subscription.
Eliminates polling by delivering real-time push notifications to the frontend via EventBridge → SQS → Lambda → AppSync Mutation.

## Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | Vite (SPA) / React / TypeScript / aws-amplify v6  |
| Backend API    | Go / ECS Fargate / ALB                            |
| Backend Lambda | Go / SQS trigger / AppSync Mutation               |
| Messaging      | Amazon EventBridge / Amazon SQS (with DLQ)        |
| Realtime Push  | AWS AppSync (GraphQL Subscription over WebSocket) |
| Infra          | AWS CDK (TypeScript)                              |
| CI/CD          | GitHub Actions                                    |

## Directory Structure

```text
realtime-event-platform/
├── frontend/                    # Vite + React + TypeScript
│   └── src/
│
├── backend/
│   ├── api/                     # Go API server (ECS Fargate)
│   │   ├── cmd/server/          # Server entrypoint
│   │   ├── internal/
│   │   │   ├── handler/         # HTTP handlers
│   │   │   └── usecase/         # Business logic
│   │   └── Makefile
│   │
│   └── lambda/                  # Go Lambda (SQS → AppSync Mutation)
│       ├── cmd/handler/         # Lambda entrypoint
│       └── internal/
│
├── infra/                       # AWS CDK (TypeScript)
│
├── .github/
│   ├── workflows/               # CI/CD workflows
│   └── PULL_REQUEST_TEMPLATE.md
│
└── docs/
    ├── README.md
    └── README.ja.md
```

## Getting Started

### Prerequisites

- Go 1.23+ (managed via [asdf](https://asdf-vm.com/))
- Node.js 22.x (managed via asdf)
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker (for local development)
- AWS CLI (configured with appropriate credentials)

### Backend API

```bash
cd backend/api
make up
```

### Backend Lambda

```bash
cd backend/lambda
make build
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Infrastructure

```bash
cd infra
cdk bootstrap   # first time only
cdk diff        # preview changes
cdk deploy      # apply changes
```
