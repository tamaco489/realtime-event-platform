import { EventFeed } from "@features/event-feed/ui/EventFeed";
import { EventSenderForm } from "@features/event-sender/ui/EventSenderForm";

/**
 * イベントダッシュボードページ
 *
 * イベント送信フォームとリアルタイムフィードを 1 画面に表示する。
 */
export function EventDashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-white">Realtime Event Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">イベント送信</h2>
          <EventSenderForm />
        </section>
        <section className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">イベントフィード</h2>
          <EventFeed />
        </section>
      </div>
    </main>
  );
}
