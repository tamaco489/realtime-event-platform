# realtime-event-platform

> 日本語版: [README.ja.md](README.ja.md)

## Overview

Reference implementation of an event-driven architecture using AWS AppSync Subscription.
Eliminates polling by delivering real-time push notifications to the frontend via SQS → Lambda → AppSync Mutation.

## Architecture

![Architecture](architecture.svg)

## Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | Vite (SPA) / React / TypeScript / aws-amplify v6  |
| Backend API    | Go / API Gateway / Lambda                         |
| Backend Lambda | Go / SQS trigger / AppSync Mutation               |
| Messaging      | Amazon SQS (with DLQ)                             |
| Realtime Push  | AWS AppSync (GraphQL Subscription over WebSocket) |
| Infra          | AWS CDK (TypeScript)                              |
| CI/CD          | GitHub Actions                                    |

## Directory Structure

```text
realtime-event-platform/
├── frontend/                    # Vite + React + TypeScript (FSD)
│   └── src/
│       ├── app/                 # Providers, router, global config
│       ├── pages/               # Page components
│       ├── widgets/             # Composite UI blocks
│       ├── features/            # Feature slices (events/, auth/)
│       └── shared/              # Shared utils, GraphQL codegen
│
├── backend/                     # Go Lambda — unified module
│   ├── cmd/
│   │   ├── api/main.go          # API Lambda entrypoint
│   │   └── event/main.go        # Event Lambda entrypoint
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── api/             # REST handler → publisher
│   │   │   └── event/           # SQS handler → notifier
│   │   ├── library/
│   │   │   ├── publisher/       # SQS SendMessage client
│   │   │   └── notifier/        # AppSync Mutation client
│   │   └── types/
│   ├── go.mod
│   └── Makefile
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

- Go 1.24.x (managed via [asdf](https://asdf-vm.com/))
- Node.js 24.x (managed via asdf)
- AWS CDK CLI (`npm install -g aws-cdk`)
- AWS CLI (configured with appropriate credentials)

### Backend

```bash
cd backend
make build-api    # build API Lambda binary
make build-event  # build Event Lambda binary
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
