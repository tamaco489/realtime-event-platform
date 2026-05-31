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
│   ├── bin/app.ts               # CDK App entrypoint — instantiates stack with devConfig
│   ├── lib/
│   │   ├── stacks/              # Stack definitions
│   │   └── constructs/          # L3 custom constructs (one file per resource)
│   ├── config/env-config.ts     # EnvConfig type + devConfig (add stg/prd as constants)
│   ├── test/                    # CDK snapshot / unit tests (Jest)
│   ├── cdk.json
│   └── Makefile
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

- Go 1.26.x (managed via [asdf](https://asdf-vm.com/))
- Node.js 24.x (managed via asdf)
- AWS CDK CLI (`npm install -g aws-cdk`)
- AWS CLI (configured with appropriate credentials)

### Backend

```bash
cd backend

# Build API Lambda binary
make build-api

# Build Event Lambda binary
make build-event
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
npm install

# Authenticate with AWS SSO (re-run when token expires)
aws sso login --profile <your-profile>

# First time only — sets up CDK toolkit in AWS account
make bootstrap AWS_PROFILE=<your-profile>

# Synthesize CloudFormation template
make synth AWS_PROFILE=<your-profile>

# Preview changes against deployed stack
make diff AWS_PROFILE=<your-profile>

# Deploy to AWS
make deploy AWS_PROFILE=<your-profile>
```

## Deployment

Lambda code updates and infrastructure changes are managed independently.

### Lambda Code Update

CDK manages only infrastructure definitions. Lambda binary updates are handled via `backend/Makefile`.

```bash
cd backend

# Build → upload to S3 → update Lambda in one command
make deploy-lambda AWS_PROFILE=<your-profile> ENV=<env>

# Run individually
make upload-api AWS_PROFILE=<your-profile>    # Upload API Lambda to S3
make upload-event AWS_PROFILE=<your-profile>  # Upload Event Lambda to S3
make deploy-api AWS_PROFILE=<your-profile>    # Update API Lambda code
make deploy-event AWS_PROFILE=<your-profile>  # Update Event Lambda code
```

S3 upload paths:

```text
{ENV}-realtime-event-storage/
  └── artifacts/
      ├── api/bootstrap.zip
      └── event/bootstrap.zip
```
