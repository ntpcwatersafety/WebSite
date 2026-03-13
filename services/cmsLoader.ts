import { CmsData, ThankYouItem, NewsItem, AwardItem, TestimonialItem, MediaItem, GalleryItem } from '../types';
import { getFileContent, validateToken } from './githubApi';
import { CMS_SECTION_FILE_NAMES, CmsSectionFileKey, mergeCmsSplitData, normalizeCmsData } from './cmsData';

/**
 * =================================================================
 *  【CMS 資料載入服務】
 *  從 Worker API 或 public/cms/*.json 載入動態內容
 * =================================================================
 */
/**
 * 取得感恩有您
 */
export const getThankYouItems = async (): Promise<ThankYouItem[]> => {
  const data = await loadCmsData();
  return data?.thankYouItems || [];
};

/**
 * 取得協會簡介內容
 */
export const getIntroContent = async (): Promise<string> => {
  const data = await loadCmsData();
  return data?.introContent || '';
};
/**
 * 取得活動剪影（相簿）
 */

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  const data = await loadCmsData();
  return data?.galleryItems || [];
};

let cachedData: CmsData | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

const loadLocalCmsData = async (): Promise<CmsData> => {
  const sectionEntries = await Promise.all(
    (Object.keys(CMS_SECTION_FILE_NAMES) as CmsSectionFileKey[]).map(async (fileKey) => {
      const response = await fetch(`${import.meta.env.BASE_URL}cms/${CMS_SECTION_FILE_NAMES[fileKey]}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Failed to load local CMS section: ${fileKey}`);
      }
      return [fileKey, await response.json()] as const;
    })
  );

  return mergeCmsSplitData(Object.fromEntries(sectionEntries));
};

/**
 * 載入 CMS 資料
 */
export const loadCmsData = async (): Promise<CmsData | null> => {
  // 檢查快取
  if (cachedData && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedData;
  }
  // 以 GitHub 為主要資料來源：若伺服器端有設定 Token 且驗證成功，嘗試從 Worker 取得整合後的 CMS 資料
  try {
    try {
      const valid = await validateToken();
      if (valid) {
        const result = await getFileContent();
        if (result && result.content) {
          cachedData = normalizeCmsData(result.content as Partial<CmsData>);
          cacheTime = Date.now();
          return cachedData;
        }
      }
    } catch (ghCheckErr) {
      console.warn('從後端 GitHub 代理載入失敗，將回退至本地：', ghCheckErr);
    }

    // 回退：從本地 public/cms/*.json 載入
    cachedData = await loadLocalCmsData();
    cacheTime = Date.now();

    return cachedData;
  } catch (error) {
    console.error('載入 CMS 資料失敗:', error);
    return null;
  }
};

/**
 * 清除快取（強制重新載入）
 */
export const clearCmsCache = (): void => {
  cachedData = null;
  cacheTime = 0;
};

/**
 * 取得首頁最新消息
 */
export const getHomeNews = async (): Promise<NewsItem[]> => {
  const data = await loadCmsData();
  return data?.homeNews || [];
};

/**
 * 取得媒體報導
 */
export const getMediaReports = async (): Promise<MediaItem[]> => {
  const data = await loadCmsData();
  return data?.mediaReports || [];
};

/**
 * 取得獲獎紀錄
 */
export const getAwards = async (): Promise<AwardItem[]> => {
  const data = await loadCmsData();
  return data?.awards || [];
};

/**
 * 取得學員心得
 */
export const getTestimonials = async (): Promise<TestimonialItem[]> => {
  const data = await loadCmsData();
  return data?.testimonials || [];
};

/**
 * 取得訓練紀錄
 */
export const getTrainingRecords = async (): Promise<NewsItem[]> => {
  const data = await loadCmsData();
  return data?.trainingRecords || [];
};
