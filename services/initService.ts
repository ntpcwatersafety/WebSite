/**
 * 初始化服務：設置資料庫中的管理員密碼
 * 在開發過程中使用
 */

import { supabase } from './supabaseClient';

export const initializeAdminPassword = async (password: string) => {
  try {
    // 使用 RPC 函式或直接 upsert（取決於 RLS 設定）
    const { error } = await supabase
      .from('water_site_settings')
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

// 開發用：在瀏覽器控制台執行
// window.__initAdminPassword('ntpcwater2025')
if (import.meta.env.DEV) {
  (window as any).__initAdminPassword = initializeAdminPassword;
}
