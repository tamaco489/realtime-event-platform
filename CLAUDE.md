# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

@.claude/rules/github/commit-types.md
@.claude/rules/github/commit-subject.md
@.claude/rules/github/pr-description.md
@.claude/rules/github/labels.md
@.claude/rules/go/coding.md

## プロジェクト概要

AWS AppSync Subscription を用いたイベント駆動アーキテクチャのリファレンス実装。
ポーリングを廃止し、EventBridge → SQS → Lambda → AppSync Mutation によるリアルタイム Push をフロントエンドに配信する。

## アーキテクチャ概要

- **フロントエンド**: Vite (SPA) + React + TypeScript + aws-amplify v6
- **バックエンド API**: Go + API Gateway + Lambda (API Lambda 経由で REST を受け付け EventBridge へ Publish)
- **バックエンド Lambda**: Go + SQS トリガー (AppSync Mutation でフロントへ Push)
- **インフラ**: AWS CDK (TypeScript)
- **CI/CD**: GitHub Actions

## 制約事項

> [!IMPORTANT]
>
> - **即時性は求めない。時間をかけてでも根拠に基づく正確なアウトプットを行う**
> - **公式ドキュメントや関連資料の調査はメインコンテキストを汚さないよう、別途調査用エージェントに委譲する**

- **コード変更前に必ずファイルを Read ツールで読む**
- **変更は diff 形式で提示し、承認 (y) を得てから実行する**
- **git commit はユーザーの承認を得てから実行する**
- 応答は日本語・簡潔・直接的
- コメントは「なぜ」が自明でない場合のみ書く（「何をしているか」は書かない）
- コメントに句点 (。) を含めない

## 禁止事項

- `rm -rf` の使用禁止 — ファイル削除は `rm -f` を使う
- 明示的な指示なしの変更禁止
- Git フック・署名のスキップ禁止 (`--no-verify`, `--no-gpg-sign`)
- `main` ブランチへの直接 push 禁止
- 機密情報のハードコーディング禁止 (API キー, トークン, 接続情報)
- 絵文字の使用禁止 (明示的に求められた場合を除く)
