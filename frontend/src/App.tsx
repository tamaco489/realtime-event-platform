import { useState } from "react";

import { EventDashboardPage } from "@pages/event-dashboard/ui/EventDashboardPage";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="flex items-center px-6 py-4 border-b border-gray-800">
          <button
            onClick={() => setShowDashboard(false)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← トップへ戻る
          </button>
        </header>
        <EventDashboardPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-6 pt-32">
      <h1 className="text-5xl font-bold tracking-tight">Realtime Event Platform</h1>
      <p className="text-gray-400 text-lg">AppSync Subscription によるリアルタイムイベント配信</p>
      <button
        onClick={() => setShowDashboard(true)}
        className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors"
      >
        ダッシュボードへ →
      </button>
    </div>
  );
}

export default App;
