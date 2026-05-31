import { useEventSubscription } from "@features/event-feed/api";
import { useEventFeedStore } from "@features/event-feed/model/store";

/**
 * リアルタイムイベントフィードコンポーネント
 *
 * AppSync Subscription で受信したイベントをリスト表示する。
 * マウント時に Subscription を開始し、アンマウント時に切断する。
 * 接続エラー時はフォールバックメッセージを表示する。
 */
export function EventFeed() {
  const events = useEventFeedStore((s) => s.events);
  const { error } = useEventSubscription();

  if (error) {
    return <p role="alert">Subscription エラー: {error}</p>;
  }

  return (
    <ul>
      {events.length === 0 ? (
        <li>イベントを待機中...</li>
      ) : (
        events.map((event) => (
          <li key={event.event_id}>
            <strong>{event.event_type}</strong>
            <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
            <pre>{event.payload}</pre>
          </li>
        ))
      )}
    </ul>
  );
}
