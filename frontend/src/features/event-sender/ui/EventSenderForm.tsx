import { Button } from "@shared/ui/Button";
import {
  useTicketOrderForm,
  SEAT_TYPES,
  type SeatType,
} from "@features/event-sender/model/useTicketOrderForm";

/**
 * チケット注文フォームコンポーネント
 *
 * フォームの状態と送信ロジックは useTicketOrderForm に委譲する。
 * このコンポーネントはフックから受け取った値を表示・入力受付するだけにする。
 */
export function EventSenderForm() {
  const { form, setField, loading, error, handleSubmit } = useTicketOrderForm();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="event-id" className="text-sm font-medium text-gray-300">
          event_id
        </label>
        <input
          id="event-id"
          type="text"
          value={form.eventId}
          onChange={(e) => setField("eventId", e.target.value)}
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
          value={form.eventName}
          onChange={(e) => setField("eventName", e.target.value)}
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
          value={form.seatType}
          onChange={(e) => setField("seatType", e.target.value as SeatType)}
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
            value={form.quantity}
            onChange={(e) => setField("quantity", Number(e.target.value))}
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
            value={form.amount}
            onChange={(e) => setField("amount", Number(e.target.value))}
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
      <Button type="submit" label="注文する" loading={loading} loadingLabel="送信中..." />
    </form>
  );
}
