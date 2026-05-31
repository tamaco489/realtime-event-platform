import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { EnvConfig } from "../../config/env-config";
import { ApiLambda } from "../constructs/api-lambda";
import { AppSyncApi } from "../constructs/appsync-api";
import { DynamoDbTable } from "../constructs/dynamodb-table";
import { EventLambda } from "../constructs/event-lambda";
import { SqsQueue } from "../constructs/sqs-queue";

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

    const appSyncApi = new AppSyncApi(this, "AppSyncApi", {
      envName: props.config.envName,
    });

    const sqsQueue = new SqsQueue(this, "SqsQueue", {
      envName: props.config.envName,
    });

    const dynamoDbTable = new DynamoDbTable(this, "DynamoDbTable", {
      envName: props.config.envName,
    });

    new ApiLambda(this, "ApiLambda", {
      envName: props.config.envName,
      queue: sqsQueue.queue,
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });

    new EventLambda(this, "EventLambda", {
      envName: props.config.envName,
      queue: sqsQueue.queue,
      table: dynamoDbTable.table,
      appSyncUrl: appSyncApi.api.graphqlUrl,
      appSyncApiKey: appSyncApi.api.apiKey ?? "",
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });
  }
}
