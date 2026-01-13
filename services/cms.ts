import { SectionContent, NavItem, PageConfig, NewsItem, GalleryItem, MediaItem, AwardItem, CourseItem, TestimonialItem } from '../types';
import emailjs from '@emailjs/browser';

// ===============================
// 1. EmailJS 設定
// ===============================
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_hksfuel',
  TEMPLATE_ID: 'template_ruioo1o',
  PUBLIC_KEY: 'iHpUlqEoLptEllvz-'
};

// ===============================
// 2. 導覽列設定
// ===============================
export const NAV_ITEMS: NavItem[] = [
  { label: '首頁', path: '/' },
  { label: '訓練與活動', path: '/activities' },
  { label: '訓練成果', path: '/results' },
  { label: '活動剪影', path: '/gallery' },
  { label: '媒體報導', path: '/media' },
  // { label: '關於我們', path: '/about' },
  { label: '感恩有您', path: '/thankyou' },
  { label: '聯絡我們', path: '/contact' },
];

// ===============================
// 3. 頁面 Banner 與標題設定
// ===============================
export const PAGE_CONTENT: Record<string, PageConfig> = {
  home: {
    id: 'home',
    title: '推廣水上安全 守護生命價值',
    subtitle: 'New Taipei City Water Life Saving Association',
    imageUrl: 'https://images.unsplash.com/photo-1530533718754-001d2668365a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  activities: {
    id: 'activities',
    title: '訓練與活動',
    subtitle: '專業救生訓練 • 水上安全推廣 • 自救求生技能',
    imageUrl: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  results: {
    id: 'results',
    title: '訓練成果',
    subtitle: '扎實訓練 • 專業認證 • 守護水域',
    imageUrl: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  gallery: {
    id: 'gallery',
    title: '活動剪影',
    subtitle: '紀錄每一個精彩瞬間與汗水',
    imageUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  media: {
    id: 'media',
    title: '媒體報導',
    subtitle: '社會肯定 • 公益服務 • 安全宣導',
    imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  thankyou: {
    id: 'thankyou',
    title: '感恩有您',
    subtitle: '感謝每一位支持協會的夥伴',
    imageUrl: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  about: {
    id: 'about',
    title: '關於我們',
    subtitle: '協會沿革 • 組織架構 • 核心理念',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  contact: {
    id: 'contact',
    title: '聯絡我們',
    subtitle: '歡迎洽詢課程資訊與合作提案',
    imageUrl: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  }
};

// ===============================
// 4. 首頁區塊內容
// ===============================
// 最新消息區塊已由後台管理系統維護，資料來源為 public/cms-data.json，請勿直接於此編輯。
export const HOME_SECTIONS: SectionContent[] = [
  {
    id: 'intro',
    title: '協會簡介',
    type: 'text',
    content: '<strong>【新北市水上安全協會、新北市板橋游泳會及紅十字會救難大隊】</strong>致力推廣水上安全救生、游泳及防溺自救，期許實現全民<span class="text-red-500">"人人會游泳，個個會救生"</span>，歡迎有志一同的你加入我們這個大家庭。',
    isOpenDefault: true,
  },
];

// ===============================
// 5. 訓練與活動頁面內容
// ===============================
export const ACTIVITIES_SECTIONS: SectionContent[] = [];

// ===============================
// 6. 訓練成果頁面內容
// ===============================
export const RESULTS_SECTIONS: SectionContent[] = [];

// ===============================
// 7. 活動剪影（相簿）說明
// ===============================
// 活動剪影（galleryItems）已由後台管理系統維護，資料來源為 public/cms-data.json
// 欄位說明：id, imageUrl, title, description, isActive
// 請勿直接於此編輯，請至後台管理介面操作。

// ===============================
// 8. 媒體報導頁面內容
// ===============================
export const MEDIA_SECTIONS: SectionContent[] = [
  // 新聞報導、獲獎紀錄等區塊已由後台管理系統維護，資料來源為 public/cms-data.json，請勿直接於此編輯。
];

// ===============================
// 9. 靜態範例（僅供本地測試）
// ===============================
export const GALLERY_SECTIONS: SectionContent[] = [];

// ===============================
// 10. 聯絡表單發送
// ===============================
export const sendContactEmail = async (data: { name: string; email: string; subject: string; message: string }): Promise<boolean> => {
  if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
    console.warn('請先至 services/cms.ts 設定 EmailJS 的 Service ID, Template ID 與 Public Key');
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }
  try {
    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      subject: data.subject,
      message: data.message,
    };
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    console.log('SUCCESS!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('FAILED...', error);
    throw error;
  }
};

