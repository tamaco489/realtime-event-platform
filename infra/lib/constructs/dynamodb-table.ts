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
      tableName: `${props.envName}-realtime-event-table`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にテーブルも削除する (本番運用時は RETAIN 推奨)
    });

    new cdk.CfnOutput(scope, "DynamoDbTableName", {
      value: this.table.tableName,
      description: "DynamoDB event table name",
    });
  }
}
