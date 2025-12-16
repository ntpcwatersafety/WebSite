# 新北市水上安全協會官網

> 致力推廣水上安全救生、游泳及防溺自救，期許實現全民「人人會游泳，個個會救生」

## 🌐 線上網站

- **GitHub Pages**：https://ntpcwatersafety.github.io/WebSite/
- **倉庫連結**：https://github.com/ntpcwatersafety/WebSite

---

## 📋 目錄

- [專案架構](#專案架構)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [內容管理](#內容管理)
- [部署方式](#部署方式)
- [常見問題](#常見問題)

---

## 🏗️ 專案架構

```
WebSite/
├── components/              # React 元件
│   ├── Navbar.tsx          # 導覽列
│   ├── Hero.tsx            # Banner 橫幅
│   ├── Footer.tsx          # 頁尾
│   └── CollapsibleCard.tsx # 可折疊卡片
│
├── pages/                   # 頁面元件
│   ├── Home.tsx            # 首頁
│   ├── GenericPage.tsx     # 通用頁面模板
│   └── Contact.tsx         # 聯絡我們
│
├── services/
│   └── cms.ts              # ⭐ 內容管理系統（CMS）
│
├── types.ts                 # TypeScript 型別定義
├── App.tsx                  # 主應用程式
├── index.tsx                # 應用程式入口
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
└── .github/workflows/       # GitHub Actions 自動部署
    └── deploy.yml
```

---

## 🛠️ 技術棧

| 技術 | 說明 |
|------|------|
| **React 19** | 前端框架 |
| **TypeScript** | 型別安全的 JavaScript |
| **Vite** | 快速的建置工具 |
| **Tailwind CSS** | CSS 框架（CDN 方式） |
| **React Router** | 路由管理 |
| **EmailJS** | 聯絡表單郵件服務 |
| **Lucide React** | Icon 圖示庫 |
| **GitHub Actions** | 自動化部署 |

---

## 🚀 快速開始

### 前置需求

- Node.js 20 或以上版本
- npm 或 yarn

### 1️⃣ 安裝依賴

```bash
npm install
```

### 2️⃣ 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問：http://localhost:3000

### 3️⃣ 建置生產版本

```bash
npm run build
```

建置結果會輸出到 `dist/` 資料夾。

### 4️⃣ 預覽生產版本

```bash
npm run preview
```

---

## 📝 內容管理

### ⭐ 核心概念：CMS 檔案

所有網站內容都集中在 **`services/cms.ts`** 中管理，無需修改任何元件程式碼！

### 📂 CMS 結構說明

#### 1. 導覽列設定

```typescript
export const NAV_ITEMS: NavItem[] = [
  { label: '首頁', path: '/' },
  { label: '訓練與活動', path: '/activities' },
  // ... 新增或修改導覽項目
];
```

#### 2. 頁面 Banner 設定

```typescript
export const PAGE_CONTENT: Record<string, PageConfig> = {
  home: {
    id: 'home',
    title: '推廣水上安全 守護生命價值',
    subtitle: 'New Taipei City Water Life Saving Association',
    imageUrl: 'https://...'  // Banner 圖片網址
  },
  // ... 其他頁面
};
```

#### 3. 頁面內容區塊

每個頁面都有對應的 `SECTIONS` 陣列：

| 頁面 | 變數名稱 | 說明 |
|------|----------|------|
| 首頁 | `HOME_SECTIONS` | 首頁區塊內容 |
| 訓練與活動 | `ACTIVITIES_SECTIONS` | 訓練課程、活動資訊 |
| 訓練成果 | `RESULTS_SECTIONS` | 統計數據、學員心得 |
| 活動剪影 | `GALLERY_SECTIONS` | 照片、影片展示 |
| 媒體報導 | `MEDIA_SECTIONS` | 新聞報導、獲獎紀錄 |

#### 4. 區塊類型

**文字型區塊 (type: 'text')**

```typescript
{
  id: 'intro',
  title: '協會簡介',
  type: 'text',
  content: `
    <p>這裡可以使用 <strong>HTML 標籤</strong></p>
    <div class="bg-blue-50 p-4">也可以用 Tailwind CSS</div>
  `,
  isOpenDefault: true  // 預設是否展開
}
```

**列表型區塊 (type: 'list')**

```typescript
{
  id: 'news',
  title: '最新消息',
  type: 'list',
  listItems: [
    '2025-01-20 - 第 42 期救生員訓練班開放報名',
    '2025-02-15 - 春季淨灘活動志工招募'
  ],
  isOpenDefault: false
}
```

### 🎨 使用 Tailwind CSS 樣式

在 `content` 中可以直接使用 Tailwind CSS class：

```html
<!-- 文字顏色 -->
<p class="text-red-500">紅色文字</p>
<p class="text-primary">主題色文字</p>

<!-- 背景與邊框 -->
<div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
  訊息框
</div>

<!-- 網格佈局 -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
  <div>項目1</div>
  <div>項目2</div>
</div>

<!-- 按鈕 -->
<a href="#" class="bg-primary text-white px-4 py-2 rounded hover:bg-secondary">
  立即報名
</a>
```

完整 Tailwind 文件：https://tailwindcss.com/docs

### 📧 EmailJS 設定（聯絡表單）

1. 前往 https://www.emailjs.com/ 註冊帳號
2. 建立 Email Service 和 Template
3. 在 `cms.ts` 頂部修改：

```typescript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxxxx',
  TEMPLATE_ID: 'template_xxxxxx',
  PUBLIC_KEY: 'your_public_key'
};
```

---

## 🚢 部署方式

### 自動部署（推薦）

專案已設定 GitHub Actions，每次推送到 `main` 分支會自動部署到 GitHub Pages。

#### 設定步驟：

1. **啟用 GitHub Pages**
   - 前往倉庫 Settings → Pages
   - Source 選擇：**GitHub Actions**

2. **設定權限**
   - Settings → Actions → General
   - Workflow permissions 選擇：**Read and write permissions**

3. **推送程式碼**
   ```bash
   git add .
   git commit -m "Update content"
   git push
   ```

4. **查看部署進度**
   - 前往 Actions 頁面查看
   - 約 1-2 分鐘後完成

### 手動部署

```bash
npm run build
# 將 dist/ 資料夾內容上傳到您的伺服器
```

---

## ❓ 常見問題

### Q1: 修改內容後如何更新網站？

只需修改 `services/cms.ts`，然後：

```bash
git add .
git commit -m "更新內容"
git push
```

約 1-2 分鐘後網站會自動更新。

### Q2: 如何新增圖片？

可以使用外部圖床（如 Unsplash、Imgur）或將圖片放在 `public/` 資料夾：

```html
<!-- 外部圖片 -->
<img src="https://images.unsplash.com/..." alt="描述" />

<!-- 本地圖片（放在 public/images/） -->
<img src="/WebSite/images/photo.jpg" alt="描述" />
```

### Q3: 如何修改網站顏色？

在 `index.html` 中修改 Tailwind 配置：

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#006994',    // 主色
        secondary: '#4A90E2',  // 次要色
        background: '#E6F7FF', // 背景色
      }
    }
  }
}
```

### Q4: 本地開發時出現錯誤怎麼辦？

```bash
# 清除依賴重新安裝
rm -rf node_modules package-lock.json
npm install

# 重新啟動開發伺服器
npm run dev
```

### Q5: 如何新增新頁面？

1. 在 `cms.ts` 新增頁面配置和內容
2. 在 `App.tsx` 新增路由
3. 在 `NAV_ITEMS` 新增導覽項目

---

## 📞 聯絡資訊

- **協會名稱**：新北市水上安全協會
- **GitHub**：https://github.com/ntpcwatersafety

---

## 📄 授權

本專案僅供新北市水上安全協會使用。

---

## 🙏 致謝

感謝所有為水上安全教育付出的教練與志工們！

---

**最後更新**：2025年12月16日
