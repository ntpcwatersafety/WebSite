import { supabase } from './supabaseClient';

export const initializeAdminPassword = async (password: string) => {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'adminPassword', value: password },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('設定管理員密碼失敗:', error);
      return false;
    }

    console.log('✅ 管理員密碼已設置到資料庫');
    return true;
  } catch (err) {
    console.error('初始化失敗:', err);
    return false;
  }
};

if (import.meta.env.DEV) {
  (window as any).__initAdminPassword = initializeAdminPassword;
}
