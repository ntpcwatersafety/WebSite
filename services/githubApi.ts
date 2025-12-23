/**
 * =================================================================
 *  【GitHub API 服務】
 *  透過 GitHub API 更新 CMS 資料檔案
 * =================================================================
 */

// GitHub 儲存庫設定
const GITHUB_CONFIG = {
  owner: 'ntpcwatersafety',
  repo: 'WebSite',
  branch: 'main',
  dataPath: 'public/cms-data.json'
};

// Token 儲存金鑰
const TOKEN_KEY = 'ntpc_github_token';

/**
 * 儲存 GitHub Token (加密儲存)
 */
export const saveGitHubToken = (token: string): void => {
  // 簡單編碼（實際應用建議更安全的方式）
  const encoded = btoa(token);
  localStorage.setItem(TOKEN_KEY, encoded);
};

/**
 * 取得 GitHub Token
 */
export const getGitHubToken = (): string | null => {
  const encoded = localStorage.getItem(TOKEN_KEY);
  if (!encoded) return null;
  return atob(encoded);
};

/**
 * 移除 GitHub Token
 */
export const removeGitHubToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 檢查是否有設定 Token
 */
export const hasGitHubToken = (): boolean => {
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * 取得檔案目前內容和 SHA
 */
export const getFileContent = async (): Promise<{ content: any; sha: string } | null> => {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('請先設定 GitHub Token');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}?ref=${GITHUB_CONFIG.branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 檔案不存在
      }
      throw new Error(`GitHub API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    // 正確處理 UTF-8 中文字元
    const base64Content = data.content.replace(/\n/g, '');
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decodedContent = new TextDecoder('utf-8').decode(bytes);
    const content = JSON.parse(decodedContent);
    
    return { content, sha: data.sha };
  } catch (error) {
    console.error('取得檔案失敗:', error);
    throw error;
  }
};

/**
 * 更新 CMS 資料檔案
 */
export const updateCmsData = async (
  newData: any, 
  commitMessage: string = '📝 更新網站內容'
): Promise<boolean> => {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('請先設定 GitHub Token');
  }

  try {
    // 1. 取得目前檔案的 SHA
    const currentFile = await getFileContent();
    const sha = currentFile?.sha;

    // 2. 更新 lastUpdated
    newData.lastUpdated = new Date().toISOString();

    // 3. 準備新內容
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

    // 4. 發送更新請求
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: content,
          sha: sha,
          branch: GITHUB_CONFIG.branch
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `GitHub API 錯誤: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('更新檔案失敗:', error);
    throw error;
  }
};

/**
 * 驗證 Token 是否有效
 */
export const validateToken = async (): Promise<boolean> => {
  const token = getGitHubToken();
  if (!token) return false;

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.ok;
  } catch {
    return false;
  }
};
