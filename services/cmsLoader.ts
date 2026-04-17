import { ThankYouItem, NewsItem, AwardItem, MediaItem, GalleryItem } from '../types';
import { supabase } from './supabaseClient';
import { sortGalleryItems, sortThankYouItems } from './cmsData';

// ==================== 快取機制 ====================

interface CacheData {
  introContent?: string;
  homeNews?: NewsItem[];
  galleryItems?: GalleryItem[];
  activityGalleryItems?: GalleryItem[];
  resultGalleryItems?: GalleryItem[];
  mediaReports?: MediaItem[];
  awards?: AwardItem[];
  thankYouItems?: ThankYouItem[];
}

let cachedData: CacheData | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘快取

// ==================== 欄位轉換工具 ====================

/**
 * 轉換資料庫欄位（snake_case → camelCase）
 */
const convertNewsItem = (row: any): NewsItem => ({
  id: row.id,
  date: row.date,
  title: row.title,
  description: row.description,
  link: row.link,
  isNew: row.is_new,
  isPinned: row.is_pinned,
});

const convertMediaItem = (row: any): MediaItem => ({
  id: row.id,
  date: row.date,
  title: row.title,
  source: row.source,
  link: row.link,
  type: row.type,
});

const convertAwardItem = (row: any): AwardItem => ({
  id: row.id,
  year: row.year,
  title: row.title,
  description: row.description,
  icon: row.icon,
});

const convertThankYouItem = (row: any): ThankYouItem => ({
  id: row.id,
  name: row.name,
  year: row.year,
  sortOrder: row.sort_order,
  description: row.description,
});

const convertGalleryAlbum = (row: any): GalleryItem => {
  // 相容新舊表的照片關聯欄位名稱
  const photos = row.water_activity_photos || row.water_result_photos || row.water_gallery_photos || [];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isActive: row.is_active,
    date: row.date,
    category: row.category,
    sortOrder: row.sort_order,
    coverPhotoId: row.cover_photo_id,
    photos: photos.map((photo: any) => ({
      id: photo.id,
      imageUrl: photo.image_url,
      title: photo.title,
      description: photo.description,
    })),
  };
};

// ==================== 查詢函式 ====================

/**
 * 取得協會簡介
 */
export const getIntroContent = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('water_site_settings')
      .select('value')
      .eq('key', 'introContent')
      .single();
    if (error) throw error;
    return data?.value || '';
  } catch (error) {
    console.error('取得協會簡介失敗:', error);
    return '';
  }
};

/**
 * 取得首頁最新消息
 */
export const getHomeNews = async (): Promise<NewsItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_home_news')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(convertNewsItem);
  } catch (error) {
    console.error('取得最新消息失敗:', error);
    return [];
  }
};

/**
 * 取得報名資訊相簿
 */
export const getActivityGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_activity_albums')
      .select('*, water_activity_photos(*)')
      .eq('is_active', true)
      .order('date', { ascending: false });
    if (error) throw error;
    const items = (data || []).map(convertGalleryAlbum);
    return sortGalleryItems(items);
  } catch (error) {
    console.error('取得報名資訊相簿失敗:', error);
    return [];
  }
};

/**
 * 取得訓練成果相簿
 */
export const getResultGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_result_albums')
      .select('*, water_result_photos(*)')
      .eq('is_active', true)
      .order('date', { ascending: false });
    if (error) throw error;
    const items = (data || []).map(convertGalleryAlbum);
    return sortGalleryItems(items);
  } catch (error) {
    console.error('取得訓練成果相簿失敗:', error);
    return [];
  }
};

/**
 * 取得活動剪影相簿
 */
export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_gallery_albums')
      .select('*, water_gallery_photos(*)')
      .eq('type', 'gallery')
      .eq('is_active', true)
      .order('date', { ascending: false });
    if (error) throw error;
    const items = (data || []).map(convertGalleryAlbum);
    return sortGalleryItems(items);
  } catch (error) {
    console.error('取得活動剪影相簿失敗:', error);
    return [];
  }
};

/**
 * 取得媒體報導
 */
export const getMediaReports = async (): Promise<MediaItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_media_reports')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(convertMediaItem);
  } catch (error) {
    console.error('取得媒體報導失敗:', error);
    return [];
  }
};

/**
 * 取得獲獎紀錄
 */
export const getAwards = async (): Promise<AwardItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_awards')
      .select('*')
      .order('year', { ascending: false });
    if (error) throw error;
    return (data || []).map(convertAwardItem);
  } catch (error) {
    console.error('取得獲獎紀錄失敗:', error);
    return [];
  }
};

/**
 * 取得感恩有您
 */
export const getThankYouItems = async (): Promise<ThankYouItem[]> => {
  try {
    const { data, error } = await supabase
      .from('water_thank_you_items')
      .select('*')
      .order('year', { ascending: false })
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    const items = (data || []).map(convertThankYouItem);
    return sortThankYouItems(items);
  } catch (error) {
    console.error('取得感恩有您失敗:', error);
    return [];
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
 * 載入所有 CMS 資料（用於 GenericPage 動態載入）
 */
export const loadCmsData = async (): Promise<CacheData | null> => {
  try {
    const now = Date.now();

    // 檢查快取是否有效
    if (cachedData && (now - cacheTime) < CACHE_DURATION) {
      return cachedData;
    }

    // 載入所有資料
    const [introContent, homeNews, mediaReports, awards, thankYouItems] = await Promise.all([
      getIntroContent(),
      getHomeNews(),
      getMediaReports(),
      getAwards(),
      getThankYouItems(),
    ]);

    cachedData = {
      introContent,
      homeNews,
      mediaReports,
      awards,
      thankYouItems,
    };
    cacheTime = now;

    return cachedData;
  } catch (error) {
    console.error('載入 CMS 資料失敗:', error);
    return null;
  }
};

