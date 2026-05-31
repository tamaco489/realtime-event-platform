import React, { useState } from "react";

import { postEvents } from "@features/event-sender/api";

/**
 * イベント送信フォームコンポーネント
 *
 * event_type と payload (JSON) を入力して POST /events を呼び出す。
 * 送信中はボタンを disabled にしてローディングを表示し、
 * エラー時にはメッセージを表示する。送信成功時にフォームをリセットする。
 */
export function EventSenderForm() {
  const [eventType, setEventType] = useState("");
  const [payloadStr, setPayloadStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadStr) as Record<string, unknown>;
    } catch {
      setError("payload は有効な JSON 形式で入力してください");
      return;
    }

    setLoading(true);
    try {
      await postEvents({ event_type: eventType, payload });
      setEventType("");
      setPayloadStr("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="event-type">event_type</label>
        <input
          id="event-type"
          type="text"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="payload">payload (JSON)</label>
        <textarea
          id="payload"
          value={payloadStr}
          onChange={(e) => setPayloadStr(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
