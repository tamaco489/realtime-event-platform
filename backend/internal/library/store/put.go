package store

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
)

func (s *store) PutEvent(ctx context.Context, eventType string, payload map[string]any) error {
	eventID, err := uuid.NewV7()
	if err != nil {
		return err
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item: map[string]types.AttributeValue{
			"event_id":   &types.AttributeValueMemberS{Value: eventID.String()},
			"event_type": &types.AttributeValueMemberS{Value: eventType},
			"payload":    &types.AttributeValueMemberS{Value: string(payloadJSON)},
			"created_at": &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		},
	})
	return err
}
