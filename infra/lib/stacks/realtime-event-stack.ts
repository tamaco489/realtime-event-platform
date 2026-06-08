import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { EnvConfig } from "../../config/env-config";
import { ApiLambda } from "../constructs/api-lambda";
import { AppSyncApi } from "../constructs/appsync-api";
import { AppSyncAuthorizer } from "../constructs/appsync-authorizer";
import { CloudFrontS3 } from "../constructs/cloudfront-s3";
import { Cognito } from "../constructs/cognito";
import { DynamoDbTable } from "../constructs/dynamodb-table";
import { EventLambda } from "../constructs/event-lambda";
import { PreSignupLambda } from "../constructs/presignup-lambda";
import { SqsQueue } from "../constructs/sqs-queue";

/**
 * RealtimeEventStack のコンストラクタプロパティ
 *
 * @property config - 環境設定。詳細は {@link EnvConfig} を参照
 */
interface RealtimeEventStackProps extends cdk.StackProps {
  readonly config: EnvConfig;
}

/**
 * リアルタイムイベント配信プラットフォームのメインスタック
 *
 * 各リソースは lib/constructs/ 配下の L3 カスタムコンストラクトに分割して組み立てる。
 * 将来的に stateful (DynamoDB / SQS) と stateless (Lambda / AppSync) の 2 スタックに分割する予定。
 */
export class RealtimeEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RealtimeEventStackProps) {
    super(scope, id, props);

    const presignup = new PreSignupLambda(this, "PreSignupLambda", {
      envName: props.config.envName,
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });

    const cognito = new Cognito(this, "Cognito", {
      envName: props.config.envName,
      preSignUpFn: presignup.fn,
    });

    const authorizer = new AppSyncAuthorizer(this, "AppSyncAuthorizer", {
      envName: props.config.envName,
      userPool: cognito.userPool,
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });

    const appSyncApi = new AppSyncApi(this, "AppSyncApi", {
      envName: props.config.envName,
      authorizerFn: authorizer.fn,
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
      cognitoUserPoolId: cognito.userPool.userPoolId,
      cognitoRegion: this.region,
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });

    const eventLambda = new EventLambda(this, "EventLambda", {
      envName: props.config.envName,
      queue: sqsQueue.queue,
      table: dynamoDbTable.table,
      appSyncUrl: `https://${appSyncApi.api.httpDns}`,
      appSyncChannel: "tickets/orders",
      lambdaMemorySize: props.config.lambdaMemorySize,
      artifactsBucketName: props.config.artifactsBucketName,
    });

    // Event Lambda の実行ロールに AppSync への Publish 権限を付与する
    appSyncApi.api.grantPublish(eventLambda.fn);

    new CloudFrontS3(this, "CloudFrontS3", {
      envName: props.config.envName,
    });
  }
}
