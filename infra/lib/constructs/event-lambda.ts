import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_event_sources from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

/**
 * EventLambda コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property queue - SQS メインキュー。イベントソースとして設定する
 * @property table - DynamoDB イベントテーブル。書き込み権限を付与する
 * @property appSyncUrl - AppSync GraphQL エンドポイント URL
 * @property appSyncApiKey - AppSync API キー
 * @property lambdaMemorySize - Lambda 関数のメモリサイズ (MB)
 * @property artifactsBucketName - Lambda ビルド成果物を格納する S3 バケット名
 */
interface EventLambdaProps {
  readonly envName: string;
  readonly queue: sqs.Queue;
  readonly table: dynamodb.Table;
  readonly appSyncArn: string;
  readonly appSyncUrl: string;
  readonly appSyncApiKey: string;
  readonly lambdaMemorySize: number;
  readonly artifactsBucketName: string;
}

/**
 * Event Lambda コンストラクト
 *
 * arm64 / provided.al2023 で Lambda を定義し、SQS メインキューをイベントソースとして設定する。
 * パーシャルバッチ失敗対応のため reportBatchItemFailures を有効化する。
 */
export class EventLambda extends Construct {
  /** Event Lambda 関数 */
  readonly fn: lambda.Function;

  constructor(scope: Construct, id: string, props: EventLambdaProps) {
    super(scope, id);

    // Lambda Execution Role
    const role = new iam.Role(this, "Role", {
      roleName: `${props.envName}-realtime-event-event-lambda-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      // ref: https://docs.aws.amazon.com/ja_jp/aws-managed-policy/latest/reference/AWSLambdaBasicExecutionRole.html
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    this.fn = new lambda.Function(this, "Function", {
      functionName: `${props.envName}-realtime-event-event`,
      description:
        "Consumes SQS events, writes to DynamoDB, and publishes to AppSync",
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      // make upload-event で s3://{artifactsBucketName}/artifacts/event/bootstrap.zip にアップロードされたバイナリを参照する
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(
          this,
          "ArtifactsBucket",
          props.artifactsBucketName,
        ),
        "artifacts/event/bootstrap.zip",
      ),
      role,
      memorySize: props.lambdaMemorySize,
      // SQS の可視性タイムアウト (30 秒) を超えないよう 25 秒に設定する
      timeout: cdk.Duration.seconds(25),
      environment: {
        APP_ENV: props.envName,
        EVENT_SERVICE_NAME: `${props.envName}-realtime-event-event`,
        APPSYNC_API_KEY: props.appSyncApiKey,
        APPSYNC_ENDPOINT: props.appSyncUrl,
        DYNAMODB_TABLE_NAME: props.table.tableName,
      },
    });

    // cdk.json の useCdkManagedLogGroup が自動生成したロググループに保持期間 7 日とスタック削除ポリシーを設定する
    const managedLogGroup = this.fn.node.findChild("LogGroup") as logs.LogGroup;
    (managedLogGroup.node.defaultChild as logs.CfnLogGroup).retentionInDays = 7;
    managedLogGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY); // スタック削除時にテーブルも削除する (本番運用時は RETAIN 推奨)

    // DynamoDB テーブルへの書き込み権限を付与
    props.table.grantWriteData(this.fn);

    // AppSync API への Mutation 実行権限を特定の API ARN に限定して付与
    this.fn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["appsync:GraphQL"],
        resources: [`${props.appSyncArn}/types/Mutation/fields/publishEvent`],
      }),
    );

    // SQS メインキューをイベントソースとして設定し、パーシャルバッチ失敗を有効化する
    this.fn.addEventSource(
      new lambda_event_sources.SqsEventSource(props.queue, {
        reportBatchItemFailures: true,
      }),
    );
  }
}
