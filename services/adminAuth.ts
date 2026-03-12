/**
 * =================================================================
 *  【管理員認證服務】
 *  處理後台登入驗證
 * =================================================================
 */

// ⚠️ 管理員帳號設定 - 請修改為你自己的帳號密碼
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'ntpcwater2025'  // 請修改為安全的密碼
};

// Session 金鑰 (用於 localStorage)
const SESSION_KEY = 'ntpc_admin_session';
const SESSION_EXPIRY_KEY = 'ntpc_admin_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 小時

/**
 * 驗證登入（呼叫後端）
 */
export const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    if (data && data.token) {
      localStorage.setItem(SESSION_KEY, data.token);
      localStorage.setItem(SESSION_EXPIRY_KEY, (data.expiry || (Date.now() + SESSION_DURATION)).toString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('login error', error);
    return false;
  }
};

/**
 * 檢查是否已登入
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
 * 登出
 */
export const logout = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};
