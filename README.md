# 新北市水上安全協會網站

React + Vite 靜態網站，部署於 GitHub Pages，數據存儲於 Supabase（PostgreSQL）。

## 現有架構概述

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Pages                             │
│              (前台頁面 + 後台管理 SPA)                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼──────────┐  ┌──▼──────────────────┐
        │   Supabase Auth      │  │  Supabase Database   │
        │  (Email/Password)    │  │  (8 water_* Tables)  │
        │                      │  │  - news              │
        │                      │  │  - gallery           │
        │                      │  │  - awards            │
        │                      │  │  - media             │
        │                      │  │  - etc.              │
        └──────────────────────┘  └─────────────────────┘
                    │                     │
        ┌───────────▼──────────────────────▼──────────┐
        │        Supabase Storage (CDN)               │
        │  - editor-images (TinyMCE 上傳)             │
        │  - gallery-images (相簿照片)                │
        └────────────────────────────────────────────┘
```

## 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| 前台 | React 18 | UI 框架 |
| 框架 | Vite 6.4 | 打包與開發伺服器 |
| 路由 | React Router 6 | HashRouter 用於 GitHub Pages |
| UI | Tailwind CSS | 樣式 |
| 編輯器 | TinyMCE 7 | 協會簡介 HTML 編輯 |
| 數據庫 | Supabase (PostgreSQL) | CMS 數據存儲 |
| 認證 | Supabase Auth | Email/Password 登入 |
| 儲存 | Supabase Storage | 圖片文件存儲 |
| 郵件 | EmailJS | 聯絡表單發送 |
| 部署 | GitHub Actions | 自動構建與部署 |

## 目錄結構

```
src/
├── pages/                    # 頁面元件
│   ├── Home.tsx             # 首頁
│   ├── Gallery.tsx          # 相簿頁面（報名資訊/訓練成果/活動剪影）
│   ├── GenericPage.tsx      # 通用頁面（媒體報導/獲獎紀錄）
│   ├── ThankYou.tsx         # 感恩有您
│   ├── Contact.tsx          # 聯絡我們
│   └── Admin.tsx            # 後台管理框架
│       └── admin/           # 後台子頁面
│           ├── AdminLogin.tsx       # Supabase Auth 登入
│           ├── AdminDashboard.tsx   # 標籤頁導航
│           ├── AdminIntro.tsx       # 協會簡介編輯（TinyMCE）
│           ├── AdminNews.tsx        # 最新消息 CRUD
│           ├── AdminGallery.tsx     # 相簿管理（3 種類型）
│           ├── AdminMedia.tsx       # 媒體報導（YouTube 偵測）
│           ├── AdminAwards.tsx      # 獲獎紀錄 CRUD
│           └── AdminThankYou.tsx    # 感恩有您 CRUD
│
├── services/                # 服務層
│   ├── supabaseClient.ts    # Supabase 客戶端單例
│   ├── supabaseAuth.ts      # 認證服務（登入/登出/Session）
│   ├── supabaseAdmin.ts     # 後台 CRUD 操作
│   ├── cmsLoader.ts         # 前台數據加載（Supabase 查詢）
│   ├── cms.ts               # CMS 常數設定（導航、頁面配置）
│   ├── contentRenderer.tsx   # 內容渲染助手
│   └── cmsData.ts           # 數據排序與格式化
│
├── components/              # 可復用元件
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── CollapsibleCard.tsx
│   └── ... (其他 UI 元件)
│
├── types.ts                 # TypeScript 類型定義
├── App.tsx                  # 應用根元件
└── main.tsx                 # 應用入口
```

## 數據模型

### Supabase 資料表

| 表名 | 說明 | 主鍵 | 特徵 |
|------|------|------|------|
| `water_site_settings` | 站點設定（協會簡介） | key | key-value 型 |
| `water_home_news` | 首頁最新消息 | id | 支援釘選、標記為新 |
| `water_gallery_albums` | 相簿集合 | id | 支援 3 種類型（活動/成果/剪影） |
| `water_gallery_photos` | 相簿內的照片 | id | 有序排列，FK 指向相簿 |
| `water_media_reports` | 媒體報導 | id | 支援新聞/影片/文章類型 |
| `water_awards` | 獲獎紀錄 | id | 按年份排序 |
| `water_thank_you_items` | 感恩有您贊助者 | id | 按年份與排序順序排列 |
| `auth.users` | 認證用戶 | id | Supabase 內建 |

### 欄位轉換

資料庫採 `snake_case`，前端應用採 `camelCase`：

```typescript
// 資料庫 → 前端
{
  is_pinned: true,       // → isPinned
  cover_photo_id: "123", // → coverPhotoId
  sort_order: 1,         // → sortOrder
}
```

轉換邏輯在 `cmsLoader.ts` 的 `convertXxxItem()` 函式中。

## 前台頁面

| 路由 | 頁面 | 數據來源 | 更新方式 |
|------|------|---------|---------|
| `/#/` | 首頁 | Supabase | 後台編輯 |
| `/#/activities` | 報名資訊（相簿） | Supabase | 後台上傳 |
| `/#/results` | 訓練成果（相簿） | Supabase | 後台上傳 |
| `/#/gallery` | 活動剪影（相簿） | Supabase | 後台上傳 |
| `/#/media` | 媒體報導 | Supabase | 後台編輯 |
| `/#/thankyou` | 感恩有您 | Supabase | 後台編輯 |
| `/#/contact` | 聯絡我們 | EmailJS | 訪客直接填表 |
| `/#/admin` | 後台管理 | Supabase + Auth | 認證用戶操作 |

## 後台管理

### 功能概覽

| 模組 | 功能 | 特點 |
|------|------|------|
| 協會簡介 | TinyMCE HTML 編輯 | 支援圖片上傳至 editor-images |
| 最新消息 | CRUD + 釘選 | 逐項即存 |
| 活動相簿 | 上傳/刪除照片 | 支援 3 種類型，自動轉換類型 |
| 媒體報導 | CRUD + YouTube 偵測 | YouTube 連結自動嵌入 |
| 獲獎紀錄 | CRUD + Emoji 圖示 | 按年份排序 |
| 感恩有您 | CRUD + 排序控制 | 支援自訂排列順序 |

### 認證流程

```
1. 訪問 /#/admin
2. 顯示登入頁面
3. 輸入 email + 密碼
4. 調用 supabase.auth.signInWithPassword()
5. 成功 → 進入儀表板
6. 失敗 → 顯示錯誤訊息
7. 登出 → 清除 session
```

認證狀態由 `supabaseAuth.ts` 中的 `onAuthStateChange()` 監控，自動更新 UI。

### 編輯特點

所有編輯都採用**逐項即存**設計：

- ✓ 編輯欄位後自動保存到 Supabase
- ✓ 無需點擊「發布」按鈕
- ✓ Toast 通知提示保存狀態
- ✓ 完整的錯誤處理

範例：編輯消息標題

```typescript
// 用戶在輸入框輸入 → onChange 事件觸發
const handleUpdateNews = async (id: string, updates: Partial<NewsItem>) => {
  try {
    await updateNewsItem(id, updates); // 直接寫入 Supabase
    onShowToast('消息已更新', 'success');
  } catch (error) {
    onShowToast('更新失敗', 'error');
  }
};
```

## 環境變數

### 本機開發 (.env.local)

```env
VITE_SUPABASE_URL=https://nixptyjwehqcwkfwluna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### GitHub Secrets（CD 部署）

GitHub Actions 在構建時注入環境變數：

```yaml
- name: Build
  run: npm run build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### EmailJS 設定 (services/cms.ts)

```typescript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_hksfuel',
  TEMPLATE_ID: 'template_ruioo1o',
  PUBLIC_KEY: 'iHpUlqEoLptEllvz-',
};
```

## 本機開發

### 安裝與執行

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（通常在 http://localhost:3003）
npm run dev

# 構建用於部署
npm run build

# 預覽構建結果
npm run preview
```

### 本機限制

- ✓ 前台頁面可正常瀏覽，資料來自 Supabase
- ✓ 後台登入可使用（需 Supabase 專案有效）
- ✓ CRUD 操作可測試
- ✓ TinyMCE 編輯器可測試

### 常見開發任務

**修改前台樣式**

```bash
# 編輯 src/pages/*.tsx 或 src/components/*.tsx
# Vite 會自動熱更新
```

**修改後台邏輯**

```bash
# 編輯 src/pages/admin/*.tsx
# 重新整理瀏覽器查看變更
```

**新增頁面路由**

1. 在 `src/pages/` 建立新元件
2. 在 `App.tsx` Routes 中新增路由
3. 在 `services/cms.ts` 新增 PAGE_CONTENT 配置

**修改 Supabase 查詢**

```typescript
// 修改 src/services/cmsLoader.ts
// 例如新增排序條件
.order('updated_at', { ascending: false })
```

## 部署

### GitHub Pages 自動部署

1. 推送到 `main` 分支
2. GitHub Actions 自動觸發 `.github/workflows/deploy.yml`
3. 執行 `npm run build` 產生 `dist/`
4. 上傳至 GitHub Pages
5. 約 2-3 分鐘後，ntpcwsa.org 更新完成

### 部署前檢查清單

```bash
# 確保編譯無誤
npm run build

# 檢查所有 Supabase 環境變數已配置
grep VITE_SUPABASE .env.local

# 檢查無意外的文件被追蹤
git status

# 推送
git push origin main
```

## 常見問題

### Q: 後台無法登入
**A**: 確認 `.env.local` 中 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 正確無誤。

### Q: 上傳圖片失敗
**A**: 檢查 Supabase Storage 的 `editor-images` 和 `gallery-images` bucket 是否為公開（public）。

### Q: 前台無法讀取數據
**A**: 確認 Supabase RLS 策略是否允許匿名用戶讀取。預設應設為：
- `SELECT` 允許匿名用戶
- `INSERT/UPDATE/DELETE` 需要認證

### Q: GitHub Actions 部署失敗
**A**: 檢查 GitHub Secrets 是否正確設置：
- 前往 Settings → Secrets and variables → Actions
- 驗證 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 存在且格式無誤

## 維護指南

### 新增功能流程

1. **建立新數據表**（若需要）
   - 在 Supabase SQL Editor 建立表格
   - 設定主鍵、欄位、預設值
   - 設定 RLS 策略

2. **新增服務函式**
   - 在 `supabaseAdmin.ts` 新增 CRUD 函式
   - 在 `cmsLoader.ts` 新增查詢函式
   - 新增 TypeScript 類型（`types.ts`）

3. **建立後台模組**
   - 在 `pages/admin/` 建立新元件
   - 在 `AdminDashboard.tsx` 新增標籤頁
   - 實裝 CRUD UI

4. **測試與部署**
   - 本機測試通過
   - 提交 git commit
   - 推送觸發 GitHub Actions

### 常用 SQL 查詢

**檢查表格結構**

```sql
\d water_home_news;
```

**查看現有數據**

```sql
SELECT * FROM water_home_news ORDER BY date DESC LIMIT 10;
```

**清除所有數據**

```sql
TRUNCATE TABLE water_home_news;
```

**重設主鍵序列**

```sql
ALTER SEQUENCE water_home_news_id_seq RESTART WITH 1;
```

## 相關文件

- [維護指南](docs/MAINTENANCE.md) - 詳細維護說明
- [Supabase 文檔](https://supabase.com/docs) - Supabase 官方文檔
- [React 文檔](https://react.dev) - React 官方文檔
- [Vite 文檔](https://vitejs.dev) - Vite 官方文檔

## 貢獻

歡迎提交 Issues 與 Pull Requests。

## License

MIT
