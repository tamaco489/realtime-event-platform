# Go コーディングルール

## パッケージエイリアス

- エイリアスはスネークケースで統一する (例: `domain_event`, `aws_eventbridge`)
- **同一ファイル内で名前衝突が発生する場合のみ**付与する — 衝突がなければエイリアスなしで import する

## import グループ順序

空白行で区切り、以下の順序に従う。

```go
import (
    // 1. 標準パッケージ
    "context"
    "errors"

    // 2. 内部パッケージ (github.com/tamaco489/realtime-event-platform/...)
    "github.com/tamaco489/realtime-event-platform/backend/internal/domain"
    "github.com/tamaco489/realtime-event-platform/backend/pkg/errors/sentinel"

    // 3. エイリアスを付与した外部・内部パッケージ
    aws_eventbridge "github.com/aws/aws-sdk-go-v2/service/eventbridge"
)
```
