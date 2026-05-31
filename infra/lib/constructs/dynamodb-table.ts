import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

/**
 * DynamoDbTable コンストラクタプロパティ
 *
 * @property envName - 環境名。リソースの命名に使用する
 */
interface DynamoDbTableProps {
  readonly envName: string;
}

/**
 * イベント保存用 DynamoDB テーブルコンストラクト
 *
 * PAY_PER_REQUEST でテーブルを定義し、テーブル名を Stack Output に出力する。
 */
export class DynamoDbTable extends Construct {
  readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbTableProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "Table", {
      tableName: `realtime-event-table-${props.envName}`,
      partitionKey: { name: "event_id", type: dynamodb.AttributeType.STRING }, // パーティションキーは event_id (UUID 文字列) 固定
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // スタック削除時もテーブルを保持する
    });

    new cdk.CfnOutput(scope, "DynamoDbTableName", {
      value: this.table.tableName,
      description: "DynamoDB event table name",
    });
  }
}
