import { supabase } from './supabaseClient';

/**
 * 管理員登入
 */
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * 登出
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * 取得當前 session
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

/**
 * 監聽認證狀態變化
 */
export const onAuthStateChange = (callback: (isAuthenticated: boolean, user?: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(!!session, session?.user);
  });
};

/**
 * 檢查是否已登入（非同步）
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};
