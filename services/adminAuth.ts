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
 * 驗證登入
 */
export const login = (username: string, password: string): boolean => {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // 產生簡單的 session token
    const token = btoa(`${username}:${Date.now()}`);
    const expiry = Date.now() + SESSION_DURATION;
    
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    
    return true;
  }
  return false;
};

/**
 * 檢查是否已登入
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return false;
  }
  
  // 檢查是否過期
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
