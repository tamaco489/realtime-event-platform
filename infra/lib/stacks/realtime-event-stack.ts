import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { EnvConfig } from "../../config/env-config";
import { AppSyncApi } from "../constructs/appsync-api";

/**
 * RealtimeEventStack のコンストラクタプロパティ
 *
 * @property config - 環境設定。envName / bootstrapQualifier / lambdaMemorySize 等を保持する
 */
interface RealtimeEventStackProps extends cdk.StackProps {
  readonly config: EnvConfig;
}

/**
 * リアルタイムイベント配信プラットフォームのメインスタック
 *
 * PoC フェーズは単一スタックで全リソースを管理する。
 * 本番移行時に stateful (DynamoDB / SQS) と stateless (Lambda / AppSync) に分割する。
 * 各リソースは lib/constructs/ 配下の L3 カスタムコンストラクトに分割して組み立てる。
 */
export class RealtimeEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RealtimeEventStackProps) {
    super(scope, id, props);

    new AppSyncApi(this, "AppSyncApi", {
      envName: props.config.envName,
    });
  }
}
