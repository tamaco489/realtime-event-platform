import { create } from "zustand";

/**
 * 認証ストアの state とアクションの定義
 *
 * @property isAuthenticated - サインイン済みかどうか
 * @property tenantId - JWT の custom:tenantId。管理者が付与するまで null
 * @property userId - JWT の sub (Cognito ユーザー ID)
 * @property setAuth - サインイン成功時に tenantId と userId をセットする
 * @property clearAuth - サインアウト時に state をリセットする
 */
interface AuthState {
  isAuthenticated: boolean;
  tenantId: string | null;
  userId: string | null;
  setAuth: (tenantId: string | null, userId: string) => void;
  clearAuth: () => void;
}

/**
 * 認証 Zustand ストア
 *
 * fetchAuthSession() で取得した ID Token の claims を保持する。
 * tenantId は管理者が AdminUpdateUserAttributes で付与するまで null になる。
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  tenantId: null,
  userId: null,
  setAuth: (tenantId, userId) => set({ isAuthenticated: true, tenantId, userId }),
  clearAuth: () => set({ isAuthenticated: false, tenantId: null, userId: null }),
}));
