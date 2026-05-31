import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

/**
 * SqsQueue コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface SqsQueueProps {
  readonly envName: string;
}

/**
 * SQS メインキュー + DLQ コンストラクト
 *
 * 3 回処理失敗したメッセージを DLQ に移動する。
 * メインキュー URL と DLQ ARN を Stack Output に出力する。
 */
export class SqsQueue extends Construct {
  /** main queue */
  readonly queue: sqs.Queue;

  /** dlq (dead letter queue) */
  readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsQueueProps) {
    super(scope, id);

    // dlq
    this.dlq = new sqs.Queue(this, "Dlq", {
      queueName: `realtime-event-dlq-${props.envName}`,
      retentionPeriod: cdk.Duration.days(7), // dlq のメッセージ保持期間
    });

    // main queue (dlq を関連付けて作成)
    this.queue = new sqs.Queue(this, "Queue", {
      queueName: `realtime-event-queue-${props.envName}`,
      visibilityTimeout: cdk.Duration.seconds(30), // Lambda 処理中に他のコンシューマーへ同一メッセージを渡さない時間
      retentionPeriod: cdk.Duration.days(3), // main queue のメッセージ保持期間
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount: 3, // 3 回失敗で dlq に移動
      },
    });

    new cdk.CfnOutput(scope, "SqsQueueUrl", {
      value: this.queue.queueUrl,
      description: "SQS main queue URL",
    });

    new cdk.CfnOutput(scope, "SqsDlqArn", {
      value: this.dlq.queueArn,
      description: "SQS dead letter queue ARN",
    });
  }
}
