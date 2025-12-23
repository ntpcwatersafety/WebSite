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

/**
 * 🖼️ 圖片項目
 * 用於活動剪影、相簿等
 */
export interface GalleryItem {
  id: string;           // 唯一識別碼
  imageUrl: string;     // 圖片網址
  title: string;        // 圖片標題
  description?: string; // 圖片說明（選填）
  date?: string;        // 拍攝日期（選填）
  category?: string;    // 分類（選填）
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
  type: 'text' | 'list' | 'news' | 'gallery' | 'media' | 'awards' | 'courses' | 'testimonials' | 'contact_info';
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