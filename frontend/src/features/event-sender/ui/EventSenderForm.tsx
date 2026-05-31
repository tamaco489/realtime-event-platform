import React, { useState } from "react";

import { postEvents } from "@features/event-sender/api";

/** payload の key-value ペア */
interface KeyValuePair {
  key: string;
  value: string;
}

const MAX_FIELDS = 5;
const INITIAL_FIELDS: KeyValuePair[] = [
  { key: "hoge", value: "123" },
  { key: "", value: "" },
];

/**
 * イベント送信フォームコンポーネント
 *
 * event_type と payload (key-value ペア) を入力して POST /events を呼び出す。
 * payload は最大 5 件の key-value ペアから JSON オブジェクトを構築して送信する。
 * 送信中はボタンを disabled にしてローディングを表示し、
 * エラー時にはメッセージを表示する。送信成功時にフォームをリセットする。
 */
export function EventSenderForm() {
  const [eventType, setEventType] = useState("order.created");
  const [fields, setFields] = useState<KeyValuePair[]>(INITIAL_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(index: number, prop: "key" | "value", val: string) {
    setFields(fields.map((f, i) => (i === index ? { ...f, [prop]: val } : f)));
  }

  function addField() {
    if (fields.length < MAX_FIELDS) {
      setFields([...fields, { key: "", value: "" }]);
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const filled = fields.filter((f) => f.key.trim() !== "");
    if (filled.length === 0) {
      setError("payload のキーを 1 件以上入力してください");
      return;
    }

    const payload = Object.fromEntries(filled.map((f) => [f.key.trim(), f.value]));

    setLoading(true);
    try {
      await postEvents({ event_type: eventType, payload });
      setEventType("");
      setFields(INITIAL_FIELDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="event-type" className="text-sm font-medium text-gray-300">
          event_type
        </label>
        <input
          id="event-type"
          type="text"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          required
          disabled={loading}
          placeholder="例: order.created"
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">payload</span>
          <button
            type="button"
            onClick={addField}
            disabled={fields.length >= MAX_FIELDS || loading}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-md text-gray-300 transition-colors"
          >
            + フィールドを追加
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {fields.map((field, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={field.key}
                onChange={(e) => updateField(i, "key", e.target.value)}
                disabled={loading}
                placeholder="key"
                className="w-2/5 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm font-mono"
              />
              <span className="text-gray-500 text-sm">:</span>
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateField(i, "value", e.target.value)}
                disabled={loading}
                placeholder="value"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold transition-colors"
      >
        {loading ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
