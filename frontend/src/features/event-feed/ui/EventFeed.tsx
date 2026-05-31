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
    return (
      <p role="alert" className="text-red-400 text-sm">
        Subscription エラー: {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">イベントを待機中...</p>
      ) : (
        events.map((event) => (
          <div key={event.event_id} className="bg-gray-700 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-indigo-400 font-mono text-sm font-semibold">
                {event.event_type}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(event.created_at * 1000).toLocaleString()}
              </span>
            </div>
            <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap break-all">
              {event.payload}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
