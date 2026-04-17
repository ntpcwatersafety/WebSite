// 簡單的本地認證方式（帳號密碼）
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'ntpcwater2025';
const SESSION_KEY = 'admin_session';

interface AdminSession {
  username: string;
  timestamp: number;
}

/**
 * 管理員登入（帳號密碼方式）
 */
export const login = async (username: string, password: string) => {
  // 簡單的帳號密碼驗證
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const session: AdminSession = {
      username,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: { username } };
  }
  throw new Error('帳號或密碼錯誤');
};

/**
 * 登出
 */
export const logout = async () => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * 取得當前 session
 */
export const getSession = async () => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;

  try {
    const session: AdminSession = JSON.parse(sessionStr);
    // 檢查 session 是否過期（24小時）
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { user: { username: session.username } };
  } catch {
    return null;
  }
};

/**
 * 監聽認證狀態變化
 */
export const onAuthStateChange = (callback: (isAuthenticated: boolean, user?: any) => void) => {
  // 檢查初始狀態
  const sessionStr = localStorage.getItem(SESSION_KEY);
  const isAuthenticated = !!sessionStr;
  const user = isAuthenticated ? { username: 'admin' } : undefined;
  callback(isAuthenticated, user);

  // 監聽 storage 變化（同一瀏覽器多個標籤頁時同步）
  const handleStorageChange = () => {
    const updatedSessionStr = localStorage.getItem(SESSION_KEY);
    callback(!!updatedSessionStr);
  };

  window.addEventListener('storage', handleStorageChange);

  return {
    unsubscribe: () => {
      window.removeEventListener('storage', handleStorageChange);
    },
  };
};

/**
 * 檢查是否已登入（非同步）
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};
