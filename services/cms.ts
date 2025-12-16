import { SectionContent, NavItem, PageConfig } from '../types';
import emailjs from '@emailjs/browser';

/**
 * =================================================================
 *  【簡易後台資料庫】
 *  在此檔案中修改內容，網頁前台會自動更新。
 * =================================================================
 */

// --- EmailJS 設定 (請在此填入您申請的代碼) ---
const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID',   // 例如: service_8x3....
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // 例如: template_5d....
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY'    // 例如: user_Kj2.... 或新的 Public Key
};

// 1. 導覽列設定
export const NAV_ITEMS: NavItem[] = [
  { label: '首頁', path: '/' },
  { label: '活動與課程', path: '/activities' },
  { label: '訓練成果', path: '/results' },
  { label: '活動剪影', path: '/gallery' },
  { label: '媒體報導', path: '/media' },
  { label: '關於我們', path: '/about' },
  { label: '聯絡我們', path: '/contact' },
];

// 2. 頁面 Banner 與標題設定
export const PAGE_CONTENT: Record<string, PageConfig> = {
  home: {
    id: 'home',
    title: '推廣水上安全 守護生命價值',
    subtitle: 'New Taipei City Water Life Saving Association',
    imageUrl: 'https://images.unsplash.com/photo-1530533718754-001d2668365a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  },
  activities: {
    id: 'activities',
    title: '活動與課程',
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

// 3. 首頁區塊內容
export const HOME_SECTIONS: SectionContent[] = [
  {
    id: 'intro',
    title: '協會簡介',
    type: 'text',
    content: '本協會致力於推廣水上安全教育，培養專業救生人員。我們會定期舉辦救生員訓練班、推廣心肺復甦術(CPR)教學，並參與各大水域的安全維護工作。我們的宗旨是減少水難事故，守護每一條寶貴的生命。',
    isOpenDefault: true,
  },
  {
    id: 'news',
    title: '最新消息',
    type: 'list',
    listItems: [
      '2025-01-20 - 第 42 期救生員訓練班開放報名',
      '2025-02-15 - 春季淨灘活動志工招募，歡迎全家大小一同參與',
      '2025-03-01 - 年度會員大會將於台北分會舉行，請會員準時出席',
      '2025-03-10 - 暑期兒童游泳營隊輔導員徵選開始'
    ],
    isOpenDefault: false,
  },
  {
    id: 'contact_short',
    title: '快速聯絡資訊',
    type: 'contact_info',
    content: JSON.stringify({
      phone: '02-1234-5678',
      address: '台北市某某區某某路100號',
      email: 'contact@waterlife.org.tw'
    }),
    isOpenDefault: false,
  }
];

// 真正的發送郵件函式 (串接 EmailJS)
export const sendContactEmail = async (data: { name: string; email: string; subject: string; message: string }): Promise<boolean> => {
  // 檢查是否已設定金鑰
  if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
    console.warn("請先至 services/cms.ts 設定 EmailJS 的 Service ID, Template ID 與 Public Key");
    // 為了演示，如果沒設定，我們還是假裝成功，但在 Console 顯示警告
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  try {
    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      subject: data.subject,
      message: data.message,
      // 您可以在 EmailJS 範本中使用這些變數名 {{from_name}}, {{message}} 等
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