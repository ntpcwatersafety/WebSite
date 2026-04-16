import { SectionContent, NavItem, PageConfig } from '../types';
import emailjs from '@emailjs/browser';
import { loadCmsData } from './cmsLoader';

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
  { label: '報名資訊', path: '/activities' },
  { label: '訓練成果', path: '/results' },
  { label: '活動剪影', path: '/gallery' },
  { label: '媒體報導', path: '/media' },
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
    title: '報名資訊',
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
// 動態取得首頁區塊內容，合併 CMS 資料中的 introContent
export const getHomeSections = async (): Promise<SectionContent[]> => {
  const cmsData = await loadCmsData();
  return [
    {
      id: 'intro',
      title: '協會簡介',
      type: 'text',
      content: cmsData?.introContent || '',
      isOpenDefault: true,
    },
    {
      id: 'news',
      title: '最新消息',
      type: 'news',
      newsItems: cmsData?.homeNews || [],
      isOpenDefault: true,
    },
    {
      id: 'thankyou',
      title: '感恩有您',
      type: 'thankyou',
      thankYouItems: cmsData?.thankYouItems || [],
      isOpenDefault: (cmsData?.thankYouItems?.length || 0) > 0,
    },
  ];
};

// ===============================
// 5. 活動剪影（相簿）說明
// ===============================
// 活動剪影（galleryItems）已由後台管理系統維護，資料來源為 public/cms/*.json
// 欄位說明：id, imageUrl, title, description, isActive
// 請勿直接於此編輯，請至後台管理介面操作。

// ===============================
// 6. 媒體報導頁面內容
// ===============================
export const MEDIA_SECTIONS: SectionContent[] = [
  {
    id: 'news_reports',
    title: '媒體報導',
    type: 'media',
    mediaItems: [],
    isOpenDefault: true,
  },
  {
    id: 'awards',
    title: '獲獎紀錄',
    type: 'awards',
    awardItems: [],
    isOpenDefault: true,
  },
];

// ===============================
// 7. 聯絡表單發送
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

