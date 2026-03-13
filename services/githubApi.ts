import { CmsData } from '../types';
import { CmsFileShas } from './cmsData';

/**
 * =================================================================
 *  【GitHub API 服務】
 *  透過 GitHub API 更新 CMS 資料檔案
 * =================================================================
 */

// 現在透過後端 proxy 來存取 GitHub（避免將 GitHub Token 存放於前端）
// 後端提供：
// GET  /api/github/status -> { hasToken: boolean }
// GET  /api/cms            -> { content, shas }
// PUT  /api/cms            -> 更新多個 CMS JSON（需 Authorization: Bearer <admin-jwt>）

const GITHUB_PROXY = {
  statusUrl: '/api/github/status',
  cmsUrl: '/api/cms',
  uploadImageUrl: '/api/upload-image'
};

/**
 * 取得檔案目前內容和 SHA
 */
export const getFileContent = async (): Promise<{ content: CmsData; shas: CmsFileShas } | null> => {
  try {
    const resp = await fetch(GITHUB_PROXY.cmsUrl);
    if (!resp.ok) {
      if (resp.status === 404) return null;
      throw new Error(`伺服器回應錯誤: ${resp.status}`);
    }
    const data = await resp.json();
    return { content: data.content as CmsData, shas: (data.shas || {}) as CmsFileShas };
  } catch (error) {
    console.error('getFileContent error', error);
    throw error;
  }
};

/**
 * 更新 CMS 資料檔案
 */
export const updateCmsData = async (
  newData: CmsData,
  commitMessage: string = '📝 更新網站內容',
  shas?: CmsFileShas | null
): Promise<boolean> => {
  try {
    // 後端會更新 lastUpdated
    const token = localStorage.getItem('ntpc_admin_session');
    const resp = await fetch(GITHUB_PROXY.cmsUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ newData, commitMessage, shas: shas || undefined })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `更新失敗: ${resp.status}`);
    }
    return true;
  } catch (error) {
    console.error('updateCmsData error', error);
    throw error;
  }
};

/**
 * 驗證 Token 是否有效
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    const resp = await fetch(GITHUB_PROXY.statusUrl);
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!data.hasToken;
  } catch (error) {
    console.error('validateToken error', error);
    return false;
  }
};

export const uploadEditorImage = async (file: File): Promise<string> => {
  try {
    const token = localStorage.getItem('ntpc_admin_session');
    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch(GITHUB_PROXY.uploadImageUrl, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `圖片上傳失敗: ${resp.status}`);
    }

    const data = await resp.json();
    if (!data?.url) {
      throw new Error('圖片上傳成功，但未取得圖片網址');
    }

    return data.url as string;
  } catch (error) {
    console.error('uploadEditorImage error', error);
    throw error;
  }
};
