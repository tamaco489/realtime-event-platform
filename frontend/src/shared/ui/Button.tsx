/**
 * 汎用ボタンコンポーネント
 *
 * @property label - 通常時のラベル
 * @property type - ボタン種別 (デフォルト: "button")
 * @property disabled - 非活性フラグ
 * @property loading - ローディング中フラグ。true のとき loadingLabel を表示して非活性にする
 * @property loadingLabel - ローディング中のラベル (デフォルト: "送信中...")
 * @property onClick - クリックハンドラ
 */
interface ButtonProps {
  label: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick?: () => void;
}

export function Button({
  label,
  type = "button",
  disabled = false,
  loading = false,
  loadingLabel = "送信中...",
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-semibold transition-colors"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
