import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * AppSyncAuthorizer コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 * @property userPool - Cognito User Pool。Lambda が JWKS URL を構築するために使用する
 * @property lambdaMemorySize - Lambda 関数のメモリサイズ (MB)
 * @property artifactsBucketName - Lambda ビルド成果物を格納する S3 バケット名
 */
interface AppSyncAuthorizerProps {
  readonly envName: string;
  readonly userPool: cognito.UserPool;
  readonly lambdaMemorySize: number;
  readonly artifactsBucketName: string;
}

/**
 * AppSync Events Lambda Authorizer コンストラクト
 *
 * Subscribe 時に JWT 署名を Cognito JWKS で検証し、チャンネルパスの tenantId/userId と JWT claims を照合する。
 * JWKS はパッケージレベル変数にキャッシュして Lambda 実行環境をまたいで再利用する。
 */
export class AppSyncAuthorizer extends Construct {
  /** Lambda Authorizer 関数 */
  readonly fn: lambda.Function;

  constructor(scope: Construct, id: string, props: AppSyncAuthorizerProps) {
    super(scope, id);

    const role = new iam.Role(this, "Role", {
      roleName: `${props.envName}-realtime-event-appsync-authorizer-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      // ref: https://docs.aws.amazon.com/ja_jp/aws-managed-policy/latest/reference/AWSLambdaBasicExecutionRole.html
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // Lambda 関数を定義
    this.fn = new lambda.Function(this, "Function", {
      functionName: `${props.envName}-realtime-event-appsync-authorizer`,
      description:
        "AppSync Events Lambda Authorizer — JWT verification and channel path authorization",
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "bootstrap",
      // $ make upload-authorizer で s3://{artifactsBucketName}/artifacts/authorizer/bootstrap.zip にアップロードされたバイナリを参照する
      code: lambda.Code.fromBucket(
        s3.Bucket.fromBucketName(
          this,
          "ArtifactsBucket",
          props.artifactsBucketName,
        ),
        "artifacts/authorizer/bootstrap.zip",
      ),
      role,
      memorySize: props.lambdaMemorySize,
      // DOC: https://docs.aws.amazon.com/ja_jp/appsync/latest/eventapi/configure-event-api-auth.html
      // NOTE: Lambda Authorizer の標準タイムアウトは 10 秒 (ピーク時はそれより早くなる場合あり)。推奨は1秒以内だが保守的に5秒に設定
      timeout: cdk.Duration.seconds(5),
      environment: { COGNITO_USER_POOL_ID: props.userPool.userPoolId },
    });

    // cdk.json の useCdkManagedLogGroup が自動生成したロググループに保持期間 7 日とスタック削除ポリシーを設定する
    const managedLogGroup = this.fn.node.findChild("LogGroup") as logs.LogGroup;
    (managedLogGroup.node.defaultChild as logs.CfnLogGroup).retentionInDays = 7;
    managedLogGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}
