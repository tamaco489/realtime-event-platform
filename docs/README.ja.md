# realtime-event-platform

> English version: [README.md](README.md)

## 概要

AWS AppSync Subscription を用いたイベント駆動アーキテクチャのリファレンス実装。
ポーリングを廃止し、EventBridge → SQS → Lambda → AppSync Mutation によるリアルタイム Push をフロントエンドに配信する。

## 技術スタック

| レイヤー            | 技術                                              |
| ------------------- | ------------------------------------------------- |
| フロントエンド      | Vite (SPA) / React / TypeScript / aws-amplify v6  |
| バックエンド API    | Go / ECS Fargate / ALB                            |
| バックエンド Lambda | Go / SQS トリガー / AppSync Mutation              |
| メッセージング      | Amazon EventBridge / Amazon SQS (DLQ 付き)        |
| リアルタイム Push   | AWS AppSync (GraphQL Subscription over WebSocket) |
| インフラ            | AWS CDK (TypeScript)                              |
| CI/CD               | GitHub Actions                                    |

## ディレクトリ構成

```text
realtime-event-platform/
├── frontend/                    # Vite + React + TypeScript
│   └── src/
│
├── backend/
│   ├── api/                     # Go API サーバー (ECS Fargate)
│   │   ├── cmd/server/          # サーバーエントリポイント
│   │   ├── internal/
│   │   │   ├── handler/         # HTTP ハンドラー
│   │   │   └── usecase/         # ビジネスロジック
│   │   └── Makefile
│   │
│   └── lambda/                  # Go Lambda (SQS → AppSync Mutation)
│       ├── cmd/handler/         # Lambda エントリポイント
│       └── internal/
│
├── infra/                       # AWS CDK (TypeScript)
│
├── .github/
│   ├── workflows/               # CI/CD ワークフロー
│   └── PULL_REQUEST_TEMPLATE.md
│
└── docs/
    ├── README.md
    └── README.ja.md
```

## セットアップ手順

### 前提条件

- Go 1.23+ ([asdf](https://asdf-vm.com/) で管理)
- Node.js 22.x (asdf で管理)
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker (ローカル開発用)
- AWS CLI (適切なクレデンシャルで設定済み)

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
cdk bootstrap   # 初回のみ
cdk diff        # 変更内容の確認
cdk deploy      # インフラ適用
```
