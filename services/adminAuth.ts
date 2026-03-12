/**
 * =================================================================
 *  【管理員認證服務】 (前端)
 *  處理後台登入驗證（與後端 /api/login 配合）
 * =================================================================
 */

// 移除前端硬編碼的帳密，全部由後端驗證
const SESSION_KEY = 'ntpc_admin_session';
const SESSION_EXPIRY_KEY = 'ntpc_admin_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 小時

/**
 * 驗證登入（呼叫後端）
 * 仍回傳 boolean 以維持現有使用方式
 */
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (resp.status === 401) {
      return false;
    }
    if (!resp.ok) {
      console.error('login server error', resp.status);
      return false;
    }

    const data = await resp.json();
    if (data && data.token) {
      const expiry = data.expiry || (Date.now() + SESSION_DURATION);
      localStorage.setItem(SESSION_KEY, data.token);
      localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('login error', error);
    return false;
  }
};

/**
 * 檢查是否已登入（本地判斷）
 * 保持同步函式以不影響現有呼叫（例如 useEffect 內直接呼叫）
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!token || !expiry) return false;

  if (Date.now() > parseInt(expiry)) {
    logout();
    return false;
  }

  return true;
};

/**
 * 取得儲存在 localStorage 的 token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

/**
 * 登出
 */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};