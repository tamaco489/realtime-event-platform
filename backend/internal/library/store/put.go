package store

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// PutEvent はテナント・ユーザー・オーダー情報を PK/SK として DynamoDB に保存する
//
// PK = tenantID#userID, SK = orderID (UUID v7)
func (s *store) PutEvent(ctx context.Context, tenantID, userID, orderID, eventType string, payload map[string]any) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item: map[string]types.AttributeValue{
			"pk":         &types.AttributeValueMemberS{Value: tenantID + "#" + userID},
			"sk":         &types.AttributeValueMemberS{Value: orderID},
			"event_type": &types.AttributeValueMemberS{Value: eventType},
			"payload":    &types.AttributeValueMemberS{Value: string(payloadJSON)},
			"created_at": &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		},
	})
	return err
}
