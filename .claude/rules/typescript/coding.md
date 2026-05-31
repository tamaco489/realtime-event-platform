# TypeScript コーディングルール

## パッケージエイリアス

- エイリアスはスネークケースで統一する (例: `aws_appsync`, `aws_lambda`)
- **同一ファイル内で名前衝突が発生する場合のみ**付与する — 衝突がなければエイリアスなしで import する

## import グループ順序

空白行で区切り、以下の順序に従う。

```ts
import * as path from "path"; // 1. Node.js 標準モジュール

import * as cdk from "aws-cdk-lib"; // 2. 外部ライブラリ
import { Construct } from "constructs";

import { EnvConfig } from "../../config/env-config"; // 3. 内部モジュール
```

## JSDoc コメント

インターフェース・クラス・エクスポートされた型には必ずブロックコメント (`/** ... */`) を付与する。

### インターフェース / 型

```ts
/**
 * AppSyncApi コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface AppSyncApiProps {
  readonly envName: string;
}
```

### クラス

```ts
/**
 * AppSync GraphQL API コンストラクト
 *
 * API キー認証で GraphQL API を定義する。
 * エンドポイント URL と API キーは Stack Output に出力する。
 */
export class AppSyncApi extends Construct {
  ...
}
```

### プロパティ

- 1行で収まる場合は `/** 説明 */` の inline 形式にする
- 補足が必要な場合は複数行にする

```ts
export interface EnvConfig {
  /** 環境名。スタック ID やリソースの命名に使用する */
  readonly envName: string;

  /**
   * cdk bootstrap 時に指定した qualifier
   *
   * bootstrap ロール名 (cdk-{qualifier}-deploy-role-...) と一致させる必要がある。
   */
  readonly bootstrapQualifier: string;
}
```

### タグの使い方

| タグ                        | 用途                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `@property propName - 説明` | インターフェースプロパティの説明 (クラス JSDoc 内で使う場合) |
| `@example`                  | 使用例のコードブロック                                       |
| `@see {@link URL テキスト}` | 関連リンクの参照                                             |

## その他

- インターフェースのプロパティには `readonly` を付与する
- 変更されない変数は `const` で宣言する
