import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * CloudFrontS3 コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface CloudFrontS3Props {
  readonly envName: string;
}

/**
 * フロントエンド SPA 配信用 S3 + CloudFront コンストラクト
 *
 * S3 はパブリックアクセスを完全ブロックし、OAC で CloudFront のみアクセスを許可する。
 * SPA ルーティング用に 403 を /index.html (200) へリダイレクトする。
 */
export class CloudFrontS3 extends Construct {
  /** フロントエンド SPA 用 S3 バケット */
  readonly bucket: s3.Bucket;

  /** CloudFront ディストリビューション */
  readonly distribution: cloudfront.Distribution;

  // コンストラクタ
  constructor(scope: Construct, id: string, props: CloudFrontS3Props) {
    super(scope, id);

    // S3 バケットを作成 (パブリックアクセスはブロック)
    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: `${props.envName}-realtime-event-frontend`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にバケットも削除 (本番運用時は RETAIN 推奨)
      autoDeleteObjects: true,
    });

    // CloudFront ディストリビューションを作成 (OAC で S3 バケットにアクセス)
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      // S3 バケットをオリジンに設定 (OAC 経由)
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          this.bucket,
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // HTTP を HTTPS にリダイレクト
      },

      // SPA ルーティング用に 403 を /index.html (200) へリダイレクト
      defaultRootObject: "index.html",

      // 403 エラーをキャッチして /index.html にリダイレクト (SPA ルーティング対応)
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    // CloudFront のディストリビューションドメインを Stack Output に出力
    new cdk.CfnOutput(scope, "CloudFrontUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
      description: "CloudFront distribution URL",
    });
  }
}
