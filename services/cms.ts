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
  SERVICE_ID: 'service_hksfuel',   // 例如: service_8x3....
  TEMPLATE_ID: 'template_ruioo1o', // 例如: template_5d....
  PUBLIC_KEY: 'iHpUlqEoLptEllvz-'    // 例如: user_Kj2.... 或新的 Public Key
};

// 1. 導覽列設定
export const NAV_ITEMS: NavItem[] = [
  { label: '首頁', path: '/' },
  { label: '訓練與活動', path: '/activities' },
  { label: '訓練成果', path: '/results' },
  { label: '活動剪影', path: '/gallery' },
  { label: '媒體報導', path: '/media' },
  // { label: '關於我們', path: '/about' },
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
    content: '<strong>【新北市水上安全協會、新北市板橋游泳會及紅十字會救難大隊】</strong>致力推廣水上安全救生、游泳及防溺自救，期許實現全民<span class="text-red-500">"人人會游泳，個個會救生"</span>，歡迎有志一同的你加入我們這個大家庭。',
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
  // {
  //   id: 'contact_short',
  //   title: '快速聯絡資訊',
  //   type: 'contact_info',
  //   content: JSON.stringify({
  //     phone: '02-1234-5678',
  //     address: '台北市某某區某某路100號',
  //     email: 'contact@waterlife.org.tw'
  //   }),
  //   isOpenDefault: false,
  // }
];

// 4. 訓練與活動頁面內容
export const ACTIVITIES_SECTIONS: SectionContent[] = [
  {
    id: 'lifeguard_training',
    title: '救生員訓練班',
    type: 'text',
    content: `
      <div class="space-y-4">
        <p class="text-lg"><strong>專業救生員培訓課程</strong>，由經驗豐富的教練團隊授課。</p>
        <h4 class="font-bold text-primary text-lg mt-4">訓練內容包括：</h4>
        <ul class="list-disc pl-6 space-y-2 text-left">
          <li>基礎救生技能：入水法、接近法、解脫法</li>
          <li>心肺復甦術（CPR）與自動體外心臟去顫器（AED）操作</li>
          <li>水上救生器材使用：救生圈、魚雷浮標、救生板</li>
          <li>開放水域救生演練</li>
          <li>救生理論與水域安全知識</li>
        </ul>
        <div class="bg-blue-50 p-4 rounded-lg mt-4">
          <p class="text-blue-800"><strong>📅 訓練時間：</strong>每週六、日 09:00-17:00</p>
          <p class="text-blue-800"><strong>📍 訓練地點：</strong>新北市板橋運動中心游泳池</p>
          <p class="text-blue-800"><strong>💰 費用：</strong>NT$ 8,500（含證照費用）</p>
        </div>
      </div>
    `,
    isOpenDefault: true,
  },
  {
    id: 'swimming_class',
    title: '游泳訓練課程',
    type: 'text',
    content: `
      <p class="mb-4">提供<span class="text-primary font-bold">兒童、青少年、成人</span>各年齡層游泳教學。</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div class="border-l-4 border-green-500 bg-green-50 p-4">
          <h5 class="font-bold text-green-800 mb-2">🏊 兒童游泳班</h5>
          <p class="text-sm text-green-700">適合 6-12 歲，小班制教學</p>
        </div>
        <div class="border-l-4 border-blue-500 bg-blue-50 p-4">
          <h5 class="font-bold text-blue-800 mb-2">🏊‍♂️ 成人游泳班</h5>
          <p class="text-sm text-blue-700">零基礎可，一對一或團體課</p>
        </div>
      </div>
    `,
    isOpenDefault: false,
  },
  {
    id: 'beach_safety',
    title: '海域安全宣導',
    type: 'text',
    content: `
      <p>每年夏季於北海岸進行<strong class="text-red-600">水域安全宣導活動</strong>，教導民眾辨識危險水域、離岸流自救等知識。</p>
      <p class="mt-3">歡迎學校、企業、社區團體申請到校/到府宣導服務！</p>
    `,
    isOpenDefault: false,
  },
];

// 5. 訓練成果頁面內容
export const RESULTS_SECTIONS: SectionContent[] = [
  {
    id: 'certifications',
    title: '證照取得統計',
    type: 'text',
    content: `
      <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
        <h4 class="text-2xl font-bold text-primary mb-4">累計培訓成果</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-white p-4 rounded shadow">
            <p class="text-3xl font-bold text-blue-600">2,850</p>
            <p class="text-sm text-gray-600">救生員證照</p>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <p class="text-3xl font-bold text-green-600">5,200</p>
            <p class="text-sm text-gray-600">游泳學員</p>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <p class="text-3xl font-bold text-purple-600">120</p>
            <p class="text-sm text-gray-600">水安宣導場次</p>
          </div>
          <div class="bg-white p-4 rounded shadow">
            <p class="text-3xl font-bold text-red-600">45</p>
            <p class="text-sm text-gray-600">成功救援案例</p>
          </div>
        </div>
      </div>
    `,
    isOpenDefault: true,
  },
  {
    id: 'recent_graduates',
    title: '近期結訓學員',
    type: 'list',
    listItems: [
      '2024-12-15 - 第 41 期救生員訓練班，共 28 名學員順利取得證照',
      '2024-11-20 - 秋季游泳班結業，學員進步顯著',
      '2024-10-05 - 企業員工救生訓練專班，40 人完訓',
      '2024-09-12 - 暑期兒童游泳營，120 名學童參與',
    ],
    isOpenDefault: false,
  },
  {
    id: 'testimonials',
    title: '學員心得分享',
    type: 'text',
    content: `
      <div class="space-y-4 text-left">
        <blockquote class="border-l-4 border-primary bg-gray-50 p-4 italic">
          "教練非常專業且有耐心，讓我從完全不會游泳到能夠自信下水！" <br>
          <span class="text-sm text-gray-600">— 王小明，成人游泳班學員</span>
        </blockquote>
        <blockquote class="border-l-4 border-secondary bg-gray-50 p-4 italic">
          "救生員訓練課程扎實，讓我具備專業救生技能，成功考取證照！" <br>
          <span class="text-sm text-gray-600">— 李小華，救生員班學員</span>
        </blockquote>
      </div>
    `,
    isOpenDefault: false,
  },
];

// 6. 活動剪影頁面內容
export const GALLERY_SECTIONS: SectionContent[] = [
  {
    id: 'recent_activities',
    title: '近期活動照片',
    type: 'text',
    content: `
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <img src="https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400&h=300&fit=crop" 
             alt="救生訓練" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
        <img src="https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop" 
             alt="游泳教學" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
        <img src="https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=400&h=300&fit=crop" 
             alt="開放水域" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
        <img src="https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=400&h=300&fit=crop" 
             alt="頒獎典禮" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
        <img src="https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400&h=300&fit=crop" 
             alt="團隊合照" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
        <img src="https://images.unsplash.com/photo-1521933781805-022f5a287538?w=400&h=300&fit=crop" 
             alt="CPR訓練" class="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition" />
      </div>
      <p class="text-sm text-gray-500 mt-4">* 點擊圖片可放大查看</p>
    `,
    isOpenDefault: true,
  },
  {
    id: 'video_gallery',
    title: '活動影片',
    type: 'text',
    content: `
      <div class="space-y-4">
        <p class="text-gray-700">精彩活動影片即將上線，敬請期待！</p>
        <div class="bg-gray-100 rounded-lg p-8 text-center">
          <p class="text-gray-400">🎬 影片準備中...</p>
        </div>
      </div>
    `,
    isOpenDefault: false,
  },
];

// 7. 媒體報導頁面內容
export const MEDIA_SECTIONS: SectionContent[] = [
  {
    id: 'news_reports',
    title: '新聞報導',
    type: 'list',
    listItems: [
       '2023-05-26 - <a href="https://www.youtube.com/watch?v=NnLH4gOvJdM" target="_blank" rel="noopener noreferrer">守護水域安全的逆行者(點我觀看影片)</a>',
      // '2024-07-22 - 【自由時報】推廣水域安全，協會舉辦免費宣導活動',
      // '2024-06-10 - 【聯合報】救生員培訓有成，守護北海岸水域安全',
      // '2024-05-03 - 【蘋果日報】專業救生團隊，成功救援落海民眾',
    ],
    isOpenDefault: true,
  },
  {
    id: 'awards',
    title: '獲獎紀錄',
    type: 'text',
    content: `
      <div class="space-y-3 text-left">
        <div class="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <span class="text-2xl">🏆</span>
          <div>
            <p class="font-bold text-yellow-800">2024 新北市優良志工團體獎</p>
            <p class="text-sm text-yellow-700">表揚協會長期投入水域安全宣導工作</p>
          </div>
        </div>
        <div class="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <span class="text-2xl">🏅</span>
          <div>
            <p class="font-bold text-blue-800">2023 水上救生績優單位</p>
            <p class="text-sm text-blue-700">體育署頒發，肯定救生培訓成果</p>
          </div>
        </div>
      </div>
    `,
    isOpenDefault: false,
  },
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