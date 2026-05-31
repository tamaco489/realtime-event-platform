import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

/**
 * ApiLambda コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property queue - SQS メインキュー。Lambda 環境変数と SendMessage 権限付与に使用する
 * @property lambdaMemorySize - Lambda 関数のメモリサイズ (MB)
 * @property artifactsBucketName - Lambda ビルド成果物を格納する S3 バケット名
 */
interface ApiLambdaProps {
  readonly envName: string;
  readonly queue: sqs.Queue;
  readonly lambdaMemorySize: number;
  readonly artifactsBucketName: string;
}

/**
 * API Lambda + API Gateway v2 (HTTP API) コンストラクト
 *
 * arm64 / provided.al2023 で Lambda を定義し、HTTP API 経由で外部公開する。
 * IAM 実行ロールに SQS SendMessage 権限を付与し、エンドポイント URL を Stack Output に出力する。
 */
export class ApiLambda extends Construct {
  /** API Lambda 関数 */
  readonly fn: lambda.Function;

  /** HTTP API */
  readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    // Lambda Execution Role - Lambda が API Gateway から呼び出されるための基本的な実行ロールを作成
    const role = new iam.Role(this, "Role", {
      roleName: `${props.envName}-realtime-event-api-lambda-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      // ref: https://docs.aws.amazon.com/ja_jp/aws-managed-policy/latest/reference/AWSLambdaBasicExecutionRole.html
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // Lambda Function - HTTP サーバーとして実装された Go バイナリを Lambda で動かすための Web Adapter をレイヤーで追加
    this.fn = new lambda.Function(this, "Function", {
      functionName: `${props.envName}-realtime-event-api`,
      description:
        "Receives HTTP requests via API Gateway and publishes events to SQS",
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      // make upload-api で s3://{artifactsBucketName}/artifacts/api/bootstrap.zip にアップロードされたバイナリを参照する
      // objectVersion は指定しない設計。Lambda のコード更新は cdk deploy ではなく make deploy-api で行う
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(
          this,
          "ArtifactsBucket",
          props.artifactsBucketName,
        ),
        "artifacts/api/bootstrap.zip",
      ),
      role,
      // HTTP サーバーとして実装された Go バイナリを Lambda で動かすための Web Adapter
      // ref: https://github.com/awslabs/aws-lambda-web-adapter
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          "LambdaWebAdapterLayer",
          "arn:aws:lambda:ap-northeast-1:753240598075:layer:LambdaAdapterLayerArm64:24",
        ),
      ],
      memorySize: props.lambdaMemorySize,
      // HTTP API (v2) の統合タイムアウト上限は 30 秒のため、1 秒のバッファを設けて 29 秒に設定する
      // @see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html
      // > Maximum integration timeout | 30 seconds
      timeout: cdk.Duration.seconds(29),
      environment: {
        APP_ENV: props.envName,
        APP_PORT: "8080",
        API_SERVICE_NAME: `${props.envName}-realtime-event-api`,
        SQS_QUEUE_URL: props.queue.queueUrl,
      },
    });

    // cdk.json の useCdkManagedLogGroup が自動生成したロググループに保持期間 7 日とスタック削除ポリシーを設定する
    // 既存スタックに自動生成済みのロググループがある場合、logGroup プロパティで新規作成すると同名リソースの衝突が起きるためこの方式を採用
    // this.fn.logGroup は feature flag が無効な環境では fromLogGroupName() のインポート参照を返し defaultChild が存在しないため node.findChild で取得する
    const managedLogGroup = this.fn.node.findChild("LogGroup") as logs.LogGroup;
    (managedLogGroup.node.defaultChild as logs.CfnLogGroup).retentionInDays = 7;
    managedLogGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Lambda の IAM Role に SQS SendMessage 権限を付与
    props.queue.grantSendMessages(this.fn);

    // HTTP API (v2) を Lambda と統合して作成
    this.httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `${props.envName}-realtime-event-http-api`,
      description: "HTTP API for the realtime event delivery platform",
      defaultIntegration: new integrations.HttpLambdaIntegration(
        "Integration",
        this.fn,
      ),
    });

    // API Gateway のエンドポイント URL を CloudFormation Stack Output に出力
    new cdk.CfnOutput(scope, "ApiEndpointUrl", {
      value: this.httpApi.apiEndpoint,
      description: "API Gateway HTTP API endpoint URL",
    });
  }
}
