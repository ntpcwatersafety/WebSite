# 系統架構文檔

本文檔描述新北市水上安全協會網站的完整架構、數據流、技術決策與實作細節。

## 目錄

1. [系統概觀](#系統概觀)
2. [技術棧](#技術棧)
3. [架構設計](#架構設計)
4. [數據模型](#數據模型)
5. [認證與授權](#認證與授權)
6. [前端架構](#前端架構)
7. [後端服務層](#後端服務層)
8. [部署流程](#部署流程)
9. [安全性考量](#安全性考量)
10. [性能優化](#性能優化)

---

## 系統概觀

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                       終端使用者                                      │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                          (Web 瀏覽器訪問)
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                          GitHub Pages                                │
│                   (靜態網站 - React SPA)                             │
│  - 前台：首頁、相簿、媒體、感恩有您                                   │
│  - 後台：Admin 管理介面                                              │
│  - 自動構建與部署（GitHub Actions）                                  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                   (API 請求 / WebSocket)
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│  Supabase Auth   │   │  Supabase DB     │   │ Supabase Storage    │
│ (認證服務)       │   │  (PostgreSQL)    │   │ (CDN 圖片存儲)      │
│                  │   │                  │   │                     │
│ - Email/Pass     │   │ - water_* 表格   │   │ - editor-images     │
│ - Session 管理   │   │ - RLS 策略       │   │ - gallery-images    │
│ - 安全 Token     │   │ - 自動備份       │   │ - 公開 CDN 訪問     │
└──────────────────┘   └──────────────────┘   └─────────────────────┘
```

### 核心特點

- **完全無伺服器**：無需自營伺服器，所有後端託管於 Supabase
- **實時數據同步**：前台即時讀取 Supabase，無緩存延遲
- **細粒度認證**：RLS 策略保證數據隔離與存取控制
- **靜態部署**：GitHub Pages 提供快速、穩定的前台託管
- **自動化流程**：GitHub Actions 自動構建與部署

---

## 技術棧

### 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| React Router | 6.x | SPA 路由 |
| TypeScript | 5.x | 類型安全 |
| Vite | 6.4 | 打包與開發伺服器 |
| Tailwind CSS | 3.x | 樣式框架 |
| TinyMCE | 7.x | 富文本編輯器 |
| Lucide React | - | 圖標庫 |
| EmailJS | - | 客戶端郵件發送 |
| @supabase/supabase-js | - | Supabase 客戶端 |

### 後端 / 基礎設施

| 服務 | 提供商 | 用途 |
|------|--------|------|
| PostgreSQL | Supabase | 關聯式數據庫 |
| Auth | Supabase | 使用者認證與授權 |
| Storage | Supabase | 檔案存儲與 CDN |
| GitHub Pages | GitHub | 前台靜態託管 |
| GitHub Actions | GitHub | CI/CD 流程 |
| EmailJS | EmailJS | 郵件發送服務 |

### 開發工具

- **Node.js**：18+
- **npm**：9+
- **Git**：版本控制
- **VSCode**：推薦編輯器

---

## 架構設計

### 分層架構

```
┌─────────────────────────────────────────┐
│         UI 層（元件）                   │
│  - pages/*.tsx                          │
│  - components/*.tsx                     │
│  - 主要職責：渲染與使用者互動            │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│     服務層（業務邏輯）                   │
│  - services/cmsLoader.ts                │
│  - services/supabaseAdmin.ts            │
│  - services/supabaseAuth.ts             │
│  - 主要職責：數據獲取、轉換、API 調用    │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│    Supabase 客戶端（SDK）               │
│  - supabaseClient.ts                    │
│  - 主要職責：Supabase 連接與初始化       │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│   遠端服務層（API / 數據庫）            │
│  - Supabase PostgreSQL                  │
│  - Supabase Auth                        │
│  - Supabase Storage                     │
│  - EmailJS API                          │
└─────────────────────────────────────────┘
```

### 數據流方向

**前台讀取**：
```
UI 元件 → cmsLoader → Supabase DB → RLS 檢查 → 數據返回 → UI 顯示
```

**後台編輯**：
```
UI 表單 → supabaseAdmin → Supabase Auth 驗證 → DB 寫入 → RLS 檢查 → 確認保存
```

**圖片上傳**：
```
File Input → supabaseAdmin.uploadXxxImage() → Supabase Storage → 公開 URL → DB 引用
```

---

## 數據模型

### 資料表概覽

```sql
-- 站點配置
CREATE TABLE water_site_settings (
  key VARCHAR PRIMARY KEY,
  value TEXT
);

-- 首頁最新消息
CREATE TABLE water_home_news (
  id VARCHAR PRIMARY KEY,
  date DATE,
  title VARCHAR,
  description TEXT,
  link VARCHAR,
  is_new BOOLEAN,
  is_pinned BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 相簿集合
CREATE TABLE water_gallery_albums (
  id VARCHAR PRIMARY KEY,
  type VARCHAR, -- 'activities', 'results', 'gallery'
  title VARCHAR,
  description TEXT,
  is_active BOOLEAN,
  date DATE,
  category VARCHAR,
  sort_order INTEGER,
  cover_photo_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 相簿內的照片
CREATE TABLE water_gallery_photos (
  id VARCHAR PRIMARY KEY,
  album_id VARCHAR REFERENCES water_gallery_albums(id) ON DELETE CASCADE,
  image_url VARCHAR,
  title VARCHAR,
  description TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 媒體報導
CREATE TABLE water_media_reports (
  id VARCHAR PRIMARY KEY,
  date DATE,
  title VARCHAR,
  source VARCHAR,
  link VARCHAR,
  type VARCHAR, -- 'news', 'video', 'article'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 獲獎紀錄
CREATE TABLE water_awards (
  id VARCHAR PRIMARY KEY,
  year VARCHAR,
  title VARCHAR,
  description TEXT,
  icon VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 感恩有您
CREATE TABLE water_thank_you_items (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  year VARCHAR,
  sort_order INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 欄位轉換規則

**資料庫 (snake_case) ↔ 前端 (camelCase)**

| 資料庫 | 前端 | 類型 |
|--------|------|------|
| `is_new` | `isNew` | boolean |
| `is_pinned` | `isPinned` | boolean |
| `is_active` | `isActive` | boolean |
| `cover_photo_id` | `coverPhotoId` | string |
| `sort_order` | `sortOrder` | number |
| `created_at` | `createdAt` | Date |
| `updated_at` | `updatedAt` | Date |

**實作位置**：`services/cmsLoader.ts` 中的 `convertXxxItem()` 函式

### 關聯關係

```
water_gallery_albums
    ├─ (1:N) ─→ water_gallery_photos
    │           (album_id FK)
    │
    └─ (N:1) ─→ cover_photo_id (自參考)
```

**特點**：

- 相簿刪除時，自動刪除關聯照片（ON DELETE CASCADE）
- `cover_photo_id` 必須指向同相簿內的照片
- 使用 UUID 作為主鍵，便於分散式系統

---

## 認證與授權

### 認證流程

```
1. 前台訪問 /#/admin
   │
   ├─ 已登入？
   │   ├─ YES → 進入 AdminDashboard
   │   └─ NO  → 顯示 AdminLogin
   │
2. 輸入 email + 密碼
   │
3. 調用 supabase.auth.signInWithPassword()
   │
4. Supabase 驗證認證資料
   │
   ├─ 成功
   │   ├─ 返回 session 與 user 物件
   │   ├─ 儲存於瀏覽器 sessionStorage（Supabase 自動）
   │   └─ 更新 UI 為已登入狀態
   │
   └─ 失敗
       ├─ 返回錯誤訊息
       └─ 提示使用者重新輸入
```

**代碼位置**：
- 登入頁面：`pages/admin/AdminLogin.tsx`
- 認證服務：`services/supabaseAuth.ts`
- Session 監聽：`pages/Admin.tsx` 中的 `useEffect`

### 授權規則

**RLS（Row Level Security）策略**：

| 表格 | 操作 | 角色 | 條件 |
|------|------|------|------|
| 所有表格 | SELECT | 匿名用戶 | `true`（允許全部讀取） |
| 所有表格 | INSERT/UPDATE/DELETE | 認證用戶 | `true`（允許全部修改） |
| auth.users | SELECT | 認證用戶 | 只看自己的用戶資訊 |

**特點**：

- 前台完全開放讀取（無需認證）
- 後台修改需要有效的 Supabase session
- 不同角色有不同的權限等級
- 可依需求新增更細粒度的 RLS 策略

### Token 與 Session

- **Token 類型**：JWT（JSON Web Token）
- **儲存位置**：Supabase 自動管理（localStorage / sessionStorage）
- **過期時間**：預設 1 小時（可配置）
- **刷新機制**：Token 過期時自動刷新

**注意**：不要手動管理 token，Supabase 會自動處理。

---

## 前端架構

### 頁面結構

```
src/pages/
├── Home.tsx                    # 首頁（hero + 最新消息）
├── Gallery.tsx                 # 相簿頁面（報名資訊/成果/剪影）
├── GenericPage.tsx             # 通用頁面（媒體報導/獲獎紀錄）
├── ThankYou.tsx                # 感恩有您（贊助者列表）
├── Contact.tsx                 # 聯絡我們（表單 + EmailJS）
├── Admin.tsx                   # 後台主框架
└── admin/
    ├── AdminLogin.tsx          # 登入頁面
    ├── AdminDashboard.tsx      # 標籤頁導航
    ├── AdminIntro.tsx          # 協會簡介編輯
    ├── AdminNews.tsx           # 最新消息管理
    ├── AdminActivities.tsx     # 報名資訊管理（日期、排序、QRCode）
    ├── AdminGallery.tsx        # 相簿管理
    ├── AdminResults.tsx        # 訓練成果管理（日期、排序）
    ├── AdminMedia.tsx          # 媒體報導管理
    ├── AdminAwards.tsx         # 獲獎紀錄管理
    ├── AdminMediaLibrary.tsx   # 媒體庫管理
    └── AdminThankYou.tsx       # 感恩有您管理
```

### 元件結構

```
src/components/
├── Navbar.tsx                  # 導覽列（前台）
├── Footer.tsx                  # 頁腳
├── Hero.tsx                    # 頁面 Banner
├── CollapsibleCard.tsx         # 可折疊卡片
├── AdminFeedbackToast.tsx      # 反饋提示（成功/錯誤）
├── AdminConfirmDialog.tsx      # 確認對話框
└── ... 其他 UI 元件
```

### 路由設定

在 `App.tsx`：

```typescript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/activities" element={<Gallery ... />} />
  <Route path="/results" element={<Gallery ... />} />
  <Route path="/gallery" element={<Gallery ... />} />
  <Route path="/media" element={<GenericPage ... />} />
  <Route path="/thankyou" element={<ThankYou />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/admin" element={<Admin />} />
</Routes>
```

**特點**：
- 採用 HashRouter（適合 GitHub Pages）
- 所有路由以 `/#/` 開頭
- `/admin` 會自動轉向 `/#/admin`

### 狀態管理

**未採用全域狀態管理工具**（如 Redux），原因：

1. 數據主要來自 Supabase（遠端源）
2. 元件間耦合度低
3. 複雜度較簡單
4. 減少依賴

**狀態管理方式**：

- **本地狀態**：`useState`（頁面或元件級）
- **認證狀態**：`supabaseAuth.onAuthStateChange()`（監聽全域認證變化）
- **快取**：`cmsLoader.ts` 模組級快取（5 分鐘）

### 資料獲取模式

**模式 1：頁面載入時獲取**

```typescript
const Page = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await getHomeNews();
      setData(result);
      setLoading(false);
    };
    load();
  }, []);

  return loading ? <Spinner /> : <Content data={data} />;
};
```

**模式 2：使用者操作時獲取**

```typescript
const handleEdit = async (id, updates) => {
  try {
    await updateNewsItem(id, updates);
    showToast('已保存', 'success');
    // 重新載入
    loadNews();
  } catch (error) {
    showToast('保存失敗', 'error');
  }
};
```

---

## 後端服務層

### 服務分類

#### 1. supabaseClient.ts - 客戶端初始化

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**職責**：

- 初始化 Supabase 客戶端
- 驗證環境變數
- 單例模式（全應用使用同一個實例）

#### 2. supabaseAuth.ts - 認證服務

```typescript
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(!!session, session?.user);
  });
};
```

**方法**：

- `login(email, password)` - 郵箱密碼登入
- `logout()` - 登出
- `getSession()` - 獲取當前 session
- `onAuthStateChange(callback)` - 監聽認證狀態變化
- `isAuthenticated()` - 檢查是否已登入

#### 3. supabaseAdmin.ts - 後台 CRUD

**新增**：

```typescript
export const createNewsItem = async (item: Omit<NewsItem, 'id'>) => {
  const id = `homeNews-${Date.now()}`;
  const { error } = await supabase
    .from('water_home_news')
    .insert({
      id,
      date: item.date,
      title: item.title,
      // ... 其他欄位
    });
  if (error) throw error;
  return id;
};
```

**更新**：

```typescript
export const updateNewsItem = async (id: string, changes: Partial<NewsItem>) => {
  const updateData: Record<string, any> = {};
  if (changes.date) updateData.date = changes.date;
  if (changes.title) updateData.title = changes.title;
  // ...

  const { error } = await supabase
    .from('water_home_news')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};
```

**刪除**：

```typescript
export const deleteNewsItem = async (id: string) => {
  const { error } = await supabase
    .from('water_home_news')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
```

**圖片上傳**：

```typescript
export const uploadAlbumPhoto = async (
  albumId: string,
  file: File,
  title: string
) => {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  // 上傳到 Storage
  const { error: uploadError } = await supabase.storage
    .from('gallery-images')
    .upload(fileName, file);
  
  // 取得公開 URL
  const { data } = supabase.storage.from('gallery-images').getPublicUrl(fileName);
  
  // 新增資料庫記錄
  const { error: insertError } = await supabase
    .from('water_gallery_photos')
    .insert({
      id: photoId,
      album_id: albumId,
      image_url: data.publicUrl,
      title,
    });
  
  return { photoId, imageUrl: data.publicUrl };
};
```

#### 4. cmsLoader.ts - 前台數據加載

**查詢函式**：

```typescript
export const getHomeNews = async (): Promise<NewsItem[]> => {
  const { data, error } = await supabase
    .from('water_home_news')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('date', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(convertNewsItem);
};
```

**轉換函式**：

```typescript
const convertNewsItem = (row: any): NewsItem => ({
  id: row.id,
  date: row.date,
  title: row.title,
  description: row.description,
  link: row.link,
  isNew: row.is_new,           // snake_case → camelCase
  isPinned: row.is_pinned,
});
```

**特點**：

- 自動欄位轉換（snake_case → camelCase）
- 模組級快取（5 分鐘）
- 錯誤處理與 fallback

### 錯誤處理模式

```typescript
try {
  const result = await supabase.from('table').select('*');
  if (error) {
    console.error('查詢失敗:', error);
    throw error;
  }
  return result;
} catch (error) {
  console.error('操作失敗:', error);
  // UI 顯示友善的錯誤訊息
  onShowToast('操作失敗，請重試', 'error');
  return [];
}
```

---

## 部署流程

### GitHub Actions 工作流

檔案：`.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 部署步驟

1. **推送代碼**
   ```bash
   git push origin main
   ```

2. **GitHub Actions 觸發**
   - 檢出代碼
   - 安裝依賴
   - 設定環境變數（從 GitHub Secrets）
   - 執行 `npm run build`
   - 上傳 `dist/` 到 GitHub Pages

3. **自動部署**
   - 約 2-3 分鐘後完成
   - ntpcwsa.org 更新

4. **驗證**
   - 訪問 https://ntpcwsa.org
   - 確認新內容已上線

### 環境變數設置

進入 GitHub repo → Settings → Secrets and variables → Actions

新增以下 Secrets：

| 名稱 | 值 |
|------|-----|
| `VITE_SUPABASE_URL` | `https://nixptyjwehqcwkfwluna.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | （粘貼實際的 ANON_KEY） |

**注意**：ANON_KEY 是公開的（前端可見），但受 RLS 策略保護。

---

## 安全性考量

### 前端安全

**不在代碼中存儲密鑰**：

```typescript
// ❌ 錯誤：不要這樣做
const ADMIN_PASSWORD = 'password123';

// ✓ 正確：使用環境變數
const url = import.meta.env.VITE_SUPABASE_URL;
```

**ANON_KEY 的安全性**：

- ANON_KEY 在前端是**可見的**（這是正常的）
- 安全性由 **RLS 策略**保證（非 Key 本身）
- RLS 檢查所有操作（SELECT/INSERT/UPDATE/DELETE）

**認證狀態保護**：

```typescript
// 私有路由保護
if (!isAuthenticated) {
  return <AdminLogin />;
}
```

### 後端安全

**RLS 策略示例**：

```sql
-- 允許所有人讀取
CREATE POLICY read_all ON water_home_news
  FOR SELECT USING (true);

-- 只允許認證用戶修改
CREATE POLICY write_authenticated ON water_home_news
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**數據驗證**：

```typescript
// 伺服器端驗證（Supabase 側）
export const createNewsItem = async (item: Omit<NewsItem, 'id'>) => {
  // 最小驗證
  if (!item.title || !item.date) {
    throw new Error('缺少必要欄位');
  }
  
  // Supabase schema 會進一步驗證
  const { error } = await supabase
    .from('water_home_news')
    .insert({ /* ... */ });
};
```

### API 速率限制

Supabase 免費方案有速率限制：

- **數據庫**：每秒 50 個連接
- **Storage**：每分鐘 200 個請求
- **Auth**：每分鐘 100 個請求

應對策略：

1. 實裝客戶端緩存（已在 `cmsLoader.ts`）
2. 使用連接池（Supabase 已配置）
3. 避免 N+1 查詢

### HTTPS 與 CORS

- **前台**：GitHub Pages 自動使用 HTTPS
- **API**：Supabase 自動使用 HTTPS
- **CORS**：Supabase 允許跨域請求（前端訪問）

---

## 性能優化

### 前端優化

**1. 程式碼分割**（Vite 自動）

```typescript
// 動態導入（按需加載）
const AdminGallery = lazy(() => import('./AdminGallery'));
```

**2. 快取策略**

```typescript
// cmsLoader.ts 中的 5 分鐘快取
const CACHE_DURATION = 5 * 60 * 1000;

if (cachedData && (now - cacheTime) < CACHE_DURATION) {
  return cachedData;
}
```

**3. 圖片優化**

- 使用 Supabase CDN（全球 CDN）
- 支援自動壓縮（瀏覽器側 2MB+ 圖片）
- WebP / AVIF 格式支援

**4. 包大小**

```bash
npm run build
# dist/assets/index-*.js 534.69 kB (gzipped: 154.06 kB)
```

優化空間：

- 分割 TinyMCE（目前全量引入）
- 樹搖優化（已由 Vite 處理）

### 後端優化

**1. 查詢最佳化**

```typescript
// ❌ 低效：N+1 查詢
const albums = await getGalleryItems();
for (const album of albums) {
  const photos = await getAlbumPhotos(album.id); // 每個相簿查一次
}

// ✓ 高效：單一 JOIN 查詢
const albums = await supabase
  .from('water_gallery_albums')
  .select('*, water_gallery_photos(*)');
```

**2. 連接池**

Supabase 自動管理連接池，無需手動配置。

**3. 索引**

主鍵自動索引，其他欄位視需要建立：

```sql
CREATE INDEX idx_water_home_news_date ON water_home_news(date DESC);
CREATE INDEX idx_water_gallery_albums_type ON water_gallery_albums(type);
```

---

## 監控與日誌

### 本機開發

開啟瀏覽器 DevTools：

- **Network 標籤**：檢查 API 請求
- **Console 標籤**：檢查錯誤日誌
- **Application 標籤**：檢查 localStorage（Supabase session）

### 生產環境

**Supabase 控制台監控**：

- Database → Logs：查看 SQL 查詢日誌
- Auth → Logs：查看認證事件
- Storage → Usage：檢查存儲用量

**Google Analytics**（可選）：

在 `src/main.tsx` 中集成 GA4，跟蹤用戶行為。

---

## 未來可擴展性

### 潛在改進

| 項目 | 優先級 | 說明 |
|------|--------|------|
| 評論系統 | 低 | 新增 water_comments 表 |
| 用戶帳戶 | 低 | 會員登入與個人頁面 |
| 全文搜尋 | 中 | Supabase 全文搜尋功能 |
| 實時通知 | 低 | Supabase Realtime 訂閱 |
| 報表分析 | 中 | 訪問量、編輯歷史統計 |
| 多語言支援 | 低 | i18n 國際化 |
| 行動應用 | 低 | React Native / Flutter |

---

## 總結

本架構採用現代的、雲端優先的設計：

✅ **優點**：

- 無需自營伺服器
- 自動備份與災難恢復
- 全球 CDN 圖片加速
- 內置認證與授權
- 易於擴展

⚠️ **限制**：

- 受 Supabase 配額限制
- 依賴第三方服務可用性
- 初始學習曲線

---

**文檔版本**: 2.1  
**最後更新**: 2026-04-18  
**維護者**: 新北市水上安全協會

---

## 最新更新日誌

### 2026-04-18
- 新增日期與排序欄位到報名資訊（AdminActivities）與訓練成果（AdminResults）
- 整理專案結構，刪除未使用的檔案：`scripts/`、`public/admin/`、`services/initService.ts`
- 更新頁面結構文檔
