import { NewsItem, AwardItem, TestimonialItem, MediaItem } from '../types';

/**
 * =================================================================
 *  【CMS 資料載入服務】
 *  從 cms-data.json 載入動態內容
 * =================================================================
 */

export interface CmsData {
  lastUpdated: string;
  homeNews: NewsItem[];
  mediaReports: MediaItem[];
  awards: AwardItem[];
  testimonials: TestimonialItem[];
  trainingRecords: NewsItem[];
}

let cachedData: CmsData | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

/**
 * 載入 CMS 資料
 */
export const loadCmsData = async (): Promise<CmsData | null> => {
  // 檢查快取
  if (cachedData && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}cms-data.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error('Failed to load CMS data');
    }
    
    cachedData = await response.json();
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
