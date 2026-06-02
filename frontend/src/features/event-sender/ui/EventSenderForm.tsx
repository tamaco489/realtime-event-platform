import React, { useState } from "react";

import { postTicketOrder } from "@features/event-sender/api";

const SEAT_TYPES = ["general", "vip", "premium"] as const;
type SeatType = (typeof SEAT_TYPES)[number];

/**
 * チケット注文フォームコンポーネント
 *
 * event_id / event_name / seat_type / quantity / amount を入力して
 * POST /v1/tickets/orders を呼び出す。
 * 送信中はボタンを disabled にしてローディングを表示し、
 * エラー時にはメッセージを表示する。送信成功時にフォームをリセットする。
 */
export function EventSenderForm() {
  const [eventId, setEventId] = useState("evt-001");
  const [eventName, setEventName] = useState("技術カンファレンス 2026");
  const [seatType, setSeatType] = useState<SeatType>("general");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await postTicketOrder({
        event_id: eventId,
        event_name: eventName,
        seat_type: seatType,
        quantity,
        amount,
      });
      setEventId("");
      setEventName("");
      setSeatType("general");
      setQuantity(1);
      setAmount(5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="event-id" className="text-sm font-medium text-gray-300">
          event_id
        </label>
        <input
          id="event-id"
          type="text"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          required
          disabled={loading}
          placeholder="例: evt-001"
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="event-name" className="text-sm font-medium text-gray-300">
          event_name
        </label>
        <input
          id="event-name"
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
          disabled={loading}
          placeholder="例: 技術カンファレンス 2026"
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="seat-type" className="text-sm font-medium text-gray-300">
          seat_type
        </label>
        <select
          id="seat-type"
          value={seatType}
          onChange={(e) => setSeatType(e.target.value as SeatType)}
          disabled={loading}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {SEAT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-300">
            quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            disabled={loading}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="amount" className="text-sm font-medium text-gray-300">
            amount (円)
          </label>
          <input
            id="amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            disabled={loading}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
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
        {loading ? "送信中..." : "注文する"}
      </button>
    </form>
  );
}
