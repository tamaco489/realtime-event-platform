import { useEventSubscription } from "@features/event-feed/api";
import { useEventFeedStore } from "@features/event-feed/model/store";

/** JSON 値を型に応じた色でレンダリングするコンポーネント */
function JsonValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-purple-400">null</span>;
  if (typeof value === "boolean") return <span className="text-purple-400">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-lime-400">{value}</span>;
  if (typeof value === "string") return <span className="text-amber-300">"{value}"</span>;
  return <span className="text-gray-300">{JSON.stringify(value)}</span>;
}

/**
 * JSON 文字列をシンタックスハイライト付きでレンダリングするコンポーネント
 *
 * キーは sky、文字列値は amber、数値は lime、boolean/null は purple で色付けする。
 * パース失敗時はプレーンテキストにフォールバックする。
 */
function JsonHighlight({ json }: { json: string }) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return <span className="text-gray-300">{json}</span>;
  }

  const entries = Object.entries(parsed);

  return (
    <>
      <span className="text-gray-400">{"{"}</span>
      {"\n"}
      {entries.map(([key, value], i) => (
        <span key={key}>
          {"  "}
          <span className="text-sky-300">"{key}"</span>
          <span className="text-gray-400">: </span>
          <JsonValue value={value} />
          {i < entries.length - 1 && <span className="text-gray-400">,</span>}
          {"\n"}
        </span>
      ))}
      <span className="text-gray-400">{"}"}</span>
    </>
  );
}

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
            <div className="flex items-center justify-end">
              <span className="text-gray-400 text-xs">
                {new Date(event.created_at * 1000).toLocaleString()}
              </span>
            </div>
            <pre className="text-xs font-mono text-left leading-relaxed">
              <JsonHighlight json={event.payload} />
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
