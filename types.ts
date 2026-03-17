// =================================================================
//  【資料結構定義】
//  這些型別定義了 CMS 中各種資料的格式
// =================================================================

/**
 * 📰 最新消息項目
 * 用於首頁、公告等需要條列式顯示的消息
 */
export interface NewsItem {
  id: string;           // 唯一識別碼，例如: 'news-001'
  date: string;         // 日期，格式: 'YYYY-MM-DD'
  title: string;        // 標題
  description?: string; // 詳細說明（選填）
  link?: string;        // 相關連結（選填）
  isNew?: boolean;      // 是否顯示「NEW」標籤
  isPinned?: boolean;   // 是否置頂
}

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

/**
 * 🖼️ 活動剪影項目（以活動為單位）
 */
export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  isActive?: boolean;
  date?: string;
  category?: string;
  sortOrder?: number;
  coverPhotoId?: string;
  photos: GalleryPhoto[];
}

/**
 * 📺 媒體報導項目
 */
export interface MediaItem {
  id: string;           // 唯一識別碼
  date: string;         // 報導日期
  title: string;        // 報導標題
  source?: string;      // 來源媒體（選填）
  link?: string;        // 報導連結（選填）
  type: 'news' | 'video' | 'article'; // 類型
}

/**
 * 🏆 獲獎/成就項目
 */
export interface AwardItem {
  id: string;           // 唯一識別碼
  year: string;         // 年份
  title: string;        // 獎項名稱
  description?: string; // 說明（選填）
  icon?: string;        // 圖示 emoji（選填）
}

/**
 * 📋 訓練課程項目
 */
export interface CourseItem {
  id: string;           // 唯一識別碼
  title: string;        // 課程名稱
  description: string;  // 課程說明
  date?: string;        // 課程日期或排序參考日期（選填）
  sortOrder?: number;   // 自訂排序，數字越小越前面（選填）
  schedule?: string;    // 上課時間（選填）
  location?: string;    // 上課地點（選填）
  price?: string;       // 費用（選填）
  features?: string[];  // 課程特色（選填）
  isRecruiting?: boolean; // 是否正在招生
}

/**
 * 💬 學員心得項目
 */
export interface TestimonialItem {
  id: string;           // 唯一識別碼
  content: string;      // 心得內容
  author: string;       // 作者姓名
  role?: string;        // 身份說明（選填）
  date?: string;        // 日期（選填）
}

/**
 * 🙏 感恩有您項目
 */
export interface ThankYouItem {
  id: string;
  name: string;
  description?: string;
}

/**
 * 🗂️ CMS 主資料結構
 */
export interface CmsData {
  lastUpdated: string;
  courseItems: CourseItem[];
  homeNews: NewsItem[];
  mediaReports: MediaItem[];
  awards: AwardItem[];
  testimonials: TestimonialItem[];
  trainingRecords: NewsItem[];
  galleryItems: GalleryItem[];
  introContent?: string;
  thankYouItems?: ThankYouItem[];
}

export interface CmsCollectionMap {
  courseItems: CourseItem;
  homeNews: NewsItem;
  mediaReports: MediaItem;
  awards: AwardItem;
  testimonials: TestimonialItem;
  trainingRecords: NewsItem;
  galleryItems: GalleryItem;
  thankYouItems: ThankYouItem;
}

export type CmsCollectionKey = keyof CmsCollectionMap;

// 定義頁面或區塊的資料結構
export interface SectionContent {
  id: string;
  title: string;
  content?: string; // 純文字內容 (支援 HTML)
  listItems?: string[]; // 舊格式：列表內容
  newsItems?: NewsItem[]; // 新格式：結構化消息列表
  galleryItems?: GalleryItem[]; // 圖片列表
  mediaItems?: MediaItem[]; // 媒體報導列表
  awardItems?: AwardItem[]; // 獲獎列表
  courseItems?: CourseItem[]; // 課程列表
  testimonialItems?: TestimonialItem[]; // 心得列表
  thankYouItems?: ThankYouItem[]; // 感恩名單
  type: 'text' | 'list' | 'news' | 'gallery' | 'media' | 'awards' | 'courses' | 'testimonials' | 'thankyou' | 'contact_info';
  isOpenDefault?: boolean;
}

// 定義單一頁面的設定 (Banner, 標題等)
export interface PageConfig {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

// 定義聯絡表單資料結構
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// 導覽列項目結構
export interface NavItem {
  label: string;
  path: string;
}