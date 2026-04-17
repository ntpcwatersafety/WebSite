import { supabase } from './supabaseClient';

// 本地認證方式（帳號密碼）
const ADMIN_USERNAME = 'admin';
const SESSION_KEY = 'admin_session';

interface AdminSession {
  username: string;
  timestamp: number;
}

/**
 * 取得管理員密碼（從資料庫）
 */
const getAdminPassword = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('water_site_settings')
      .select('value')
      .eq('key', 'adminPassword')
      .single();

    if (error || !data?.value) {
      // 如果不存在，初始化預設密碼
      console.warn('管理員密碼未設置，使用預設密碼');
      const defaultPassword = 'ntpcwater2025';

      // 嘗試初始化到資料庫
      try {
        await supabase
          .from('water_site_settings')
          .upsert({ key: 'adminPassword', value: defaultPassword }, { onConflict: 'key' });
        console.log('✅ 已初始化管理員密碼到資料庫');
      } catch (initError) {
        console.warn('無法保存密碼到資料庫，將使用本地默認值');
      }

      return defaultPassword;
    }
    return data.value;
  } catch (error) {
    console.error('取得管理員密碼失敗:', error);
    // 備用方案：使用預設密碼
    return 'ntpcwater2025';
  }
};

/**
 * 管理員登入（帳號密碼方式）
 */
export const login = async (username: string, password: string) => {
  try {
    const adminPassword = await getAdminPassword();

    // 帳號密碼驗證
    if (username === ADMIN_USERNAME && password === adminPassword) {
      const session: AdminSession = {
        username,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { user: { username } };
    }
    throw new Error('帳號或密碼錯誤');
  } catch (error: any) {
    throw new Error(error.message || '登入失敗');
  }
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
