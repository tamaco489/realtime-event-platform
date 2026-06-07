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

## errcheck

### レスポンスボディのクローズ

`resp.Body.Close()` は戻り値を必ずチェックする。

```go
// NG
defer resp.Body.Close()

// OK
defer func() {
    if err := resp.Body.Close(); err != nil {
        log.Println(err)
    }
}()
```

### 型アサーション

`check-type-assertions: true` / `check-blank: true` が有効なため、型アサーションで ok を `_` で捨てない。if-ok パターンを使う。

```go
// NG
tenantID, _ := claims["custom:tenantId"].(string)

// OK
var tenantID string
if v, ok := claims["custom:tenantId"].(string); ok {
    tenantID = v
}
```

## govet

### shadow — err の再宣言

スコープ内で既に宣言済みの `err` を `:=` で再宣言しない。`=` を使って既存の変数に代入する。

```go
// NG: err が shadow される
sig, err := decode(parts[2])
if err := verify(sig); err != nil { ... }

// OK
sig, err := decode(parts[2])
if err = verify(sig); err != nil { ... }
```

### fieldalignment — 構造体フィールドの順序

GC スキャン範囲を最小化するため、ポインタを含むフィールドを先頭にまとめ、非ポインタフィールドを末尾に置く。

| 型                                          | ポインタ含む |
| ------------------------------------------- | ------------ |
| `string`, `[]T`, `map`, `*T`, `interface{}` | 含む         |
| `int`, `uint32`, `bool`, `sync.RWMutex` 等  | 含まない     |

```go
// NG
type example struct {
    name string       // pointer
    mu   sync.Mutex   // 非ポインタ (間に挟まると GC スキャン範囲が広がる)
    data map[string]any // pointer
}

// OK: ポインタ含むフィールドを先頭に集める
type example struct {
    name string
    data map[string]any
    mu   sync.Mutex
}
```
