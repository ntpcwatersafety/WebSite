# 維護指南

本文檔說明如何維護現有 Supabase 架構下的網站。

## 當前架構

```
前台：GitHub Pages
  ↓
Supabase（認證 + 數據庫 + 存儲）
  ↓
後台管理：後台 UI 組件
```

### 數據流

```
前台讀取流程：
  src/pages/Home.tsx (等)
  → services/cmsLoader.ts (getHomeNews, getGalleryItems 等)
  → Supabase 表格 (SELECT 查詢)
  → RLS 策略允許匿名讀取
  → 數據返回前台顯示

後台編輯流程：
  src/pages/admin/AdminNews.tsx (等)
  → services/supabaseAdmin.ts (updateNewsItem, deleteNewsItem 等)
  → Supabase Auth 驗證
  → INSERT/UPDATE/DELETE 操作
  → RLS 策略允許認證用戶修改
  → 數據保存到資料表
```

## Supabase 專案配置

### Project Details

- **Project Name**: 新北市水上安全協會
- **URL**: https://nixptyjwehqcwkfwluna.supabase.co
- **Region**: (east-asia/或其他)
- **Organization**: (您的組織)

### 環境變數

位於 `.env.local`（本機開發）和 GitHub Secrets（部署）：

```env
VITE_SUPABASE_URL=https://nixptyjwehqcwkfwluna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**重要**：不要將 ANON_KEY 提交到 git。已在 `.gitignore` 中排除 `.env.local`。

## 資料表管理

### 檢查表格

在 Supabase 控制台 → SQL Editor：

```sql
-- 列出所有 water_* 表格
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'water_%';
```

### 常用 SQL 操作

**查看表格結構**

```sql
\d water_home_news;
```

**查看現有數據**

```sql
SELECT * FROM water_home_news
ORDER BY date DESC LIMIT 10;
```

**新增測試數據**

```sql
INSERT INTO water_home_news (id, date, title, description, is_pinned)
VALUES ('test-1', '2026-04-16', '測試消息', '這是測試', false);
```

**刪除所有數據**

```sql
TRUNCATE TABLE water_home_news;
```

**檢查 RLS 策略**

```sql
SELECT * FROM pg_policies
WHERE tablename = 'water_home_news';
```

## 認證管理

### Supabase Auth Users

前往 **Supabase 控制台 → Authentication → Users**

#### 新增後台管理員

1. 點擊「Add user」
2. 選擇「Invite with email」
3. 輸入電郵地址
4. 設定暫時密碼（或自動發送邀請）
5. 用戶收到邀請後可自行設定密碼

#### 刪除用戶

1. 在用戶列表中找到用戶
2. 點選用戶
3. 點擊「Delete user」確認

#### 重設密碼

用戶在登入頁面點擊「忘記密碼」可自助重設。或管理員也可以：

1. 進入用戶詳情
2. 找到「Reset password」選項
3. 自動發送重設連結給用戶

### 前台登入流程

1. 訪問 `/#/admin`
2. 顯示 `AdminLogin` 元件
3. 輸入 email 和密碼
4. 呼叫 `supabase.auth.signInWithPassword()`
5. 成功 → 進入 `AdminDashboard`
6. 失敗 → 顯示錯誤訊息

**代碼位置**：`src/services/supabaseAuth.ts`

## 後台管理功能

### 協會簡介（AdminIntro）

- **編輯器**：TinyMCE（Rich Text）
- **數據存儲**：`water_site_settings` 表的 `key='introContent'`
- **圖片上傳**：上傳至 Supabase Storage `editor-images` bucket
- **返回 URL**：`https://nixptyjwehqcwkfwluna.supabase.co/storage/v1/object/public/editor-images/...`

### 最新消息（AdminNews）

- **操作**：新增、編輯、刪除
- **即存**：編輯後自動保存
- **特殊欄位**：
  - `is_pinned`: 釘選（首頁會優先顯示）
  - `is_new`: 標記為新（前台會顯示「新」標籤）
- **排序**：按 `is_pinned DESC` 再 `date DESC`

**代碼位置**：
- 前台讀取：`src/services/cmsLoader.ts` → `getHomeNews()`
- 後台編輯：`src/services/supabaseAdmin.ts` → `createNewsItem()` / `updateNewsItem()` / `deleteNewsItem()`
- 後台 UI：`src/pages/admin/AdminNews.tsx`

### 活動相簿（AdminGallery）

支援三種類型：

1. **報名資訊** (`type='activities'`)
2. **訓練成果** (`type='results'`)
3. **活動剪影** (`type='gallery'`)

**功能**：

- 新增 / 編輯相簿（標題、描述、日期、啟用狀態）
- 上傳照片（拖拽或點擊）
- 刪除照片
- 設定封面照片（`cover_photo_id`）
- 重新排序（目前手動調整 `sort_order`）

**數據表**：

```
water_gallery_albums
├── id (PK)
├── type ('activities' | 'results' | 'gallery')
├── title
├── description
├── is_active
├── date
├── sort_order
└── cover_photo_id (FK → water_gallery_photos.id)

water_gallery_photos
├── id (PK)
├── album_id (FK → water_gallery_albums.id)
├── image_url
├── title
├── sort_order
└── ...
```

**代碼位置**：
- 後台 CRUD：`src/services/supabaseAdmin.ts` → `createAlbum()` / `uploadAlbumPhoto()` / `deleteAlbumPhoto()` 等
- 後台 UI：`src/pages/admin/AdminGallery.tsx`

### 媒體報導（AdminMedia）

- **類型**：news / video / article
- **特殊功能**：YouTube 連結自動偵測
  - 若 URL 是 YouTube 連結，前台會自動嵌入影片預覽
  - 偵測邏輯：`isYouTubeLink()` 函式
- **排序**：按 `date DESC`

**代碼位置**：
- 後台 CRUD：`src/services/supabaseAdmin.ts` → `createMediaReport()` 等
- 後台 UI：`src/pages/admin/AdminMedia.tsx`

### 獲獎紀錄（AdminAwards）

- **欄位**：年份、獎項名稱、說明、圖示（Emoji）
- **排序**：按 `year DESC`
- **圖示**：支援 Emoji（如 🏆）或文字

**代碼位置**：
- 後台 CRUD：`src/services/supabaseAdmin.ts` → `createAward()` 等
- 後台 UI：`src/pages/admin/AdminAwards.tsx`

### 感恩有您（AdminThankYou）

- **欄位**：名稱、年份、說明、排序順序
- **排序**：按 `year DESC` 再 `sort_order ASC`
- **排序順序**：手動編輯 `sort_order` 欄位調整

**代碼位置**：
- 後台 CRUD：`src/services/supabaseAdmin.ts` → `createThankYouItem()` 等
- 後台 UI：`src/pages/admin/AdminThankYou.tsx`

## 圖片管理

### 儲存位置

圖片存儲在 Supabase Storage 中的兩個 bucket：

| Bucket | 用途 | 上傳來源 | 公開 |
|--------|------|---------|------|
| `editor-images` | TinyMCE 編輯器圖片 | 協會簡介編輯 | ✓ 公開 |
| `gallery-images` | 相簿照片 | 相簿管理上傳 | ✓ 公開 |

### 檢查圖片

在 Supabase 控制台 → Storage：

1. 點擊 `editor-images` bucket
2. 查看所有上傳的圖片
3. 可點擊圖片預覽或複製 URL

### 刪除圖片

**方式一：後台 UI**

1. 進入後台 → 活動相簿
2. 選擇相簿
3. 找到要刪除的照片
4. 點擊刪除

**方式二：Supabase 控制台**

1. 進入 Storage → bucket
2. 選擇要刪除的檔案
3. 點擊刪除

### 上傳限制

- **格式**：JPG、PNG、WEBP、GIF
- **單張上限**：8 MB
- **自動壓縮**：2 MB 以上會自動在瀏覽器端壓縮

## RLS（Row Level Security）策略

### 檢查現有策略

在 Supabase SQL Editor：

```sql
SELECT * FROM pg_policies
WHERE tablename LIKE 'water_%'
ORDER BY tablename;
```

### 標準策略

典型的 RLS 設定應為：

```sql
-- 允許匿名用戶讀取
ALTER POLICY "Enable read access for all users"
  ON water_home_news
  USING (true);

-- 允許認證用戶修改
ALTER POLICY "Enable write access for authenticated users"
  ON water_home_news
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

### 若 RLS 被意外禁用

1. 進入 Supabase SQL Editor
2. 執行：
   ```sql
   ALTER TABLE water_home_news ENABLE ROW LEVEL SECURITY;
   ```

## 部署與更新

### 本機測試

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 訪問 http://localhost:3003 或類似地址
```

### 構建

```bash
# 編譯前台
npm run build

# 輸出在 dist/ 目錄
```

### 推送到 GitHub Pages

```bash
# 檢查 git status
git status

# 新增變更
git add .

# 提交
git commit -m "描述您的變更"

# 推送到 main 分支
git push origin main
```

GitHub Actions 會自動：

1. 檢出代碼
2. 安裝依賴
3. 執行 `npm run build`
4. 部署 `dist/` 到 GitHub Pages

約 2-3 分鐘後，ntpcwsa.org 更新完成。

### GitHub Secrets

部署時需要的環境變數應存儲在 GitHub Secrets 中：

1. 進入 GitHub repo → Settings → Secrets and variables → Actions
2. 新增 Secret：
   - 名稱：`VITE_SUPABASE_URL`
   - 值：`https://nixptyjwehqcwkfwluna.supabase.co`
3. 新增 Secret：
   - 名稱：`VITE_SUPABASE_ANON_KEY`
   - 值：（粘貼實際的 ANON_KEY）

## 常見問題排查

### 後台無法登入

**現象**：輸入正確的郵箱和密碼，仍顯示「登入失敗」

**檢查清單**：

1. ✓ `.env.local` 中 `VITE_SUPABASE_URL` 是否正確
2. ✓ `VITE_SUPABASE_ANON_KEY` 是否正確
3. ✓ 該用戶是否存在於 Supabase Authentication → Users
4. ✓ 密碼是否正確
5. ✓ 該用戶的帳號是否被禁用

**解決**：

- 若用戶不存在，新增用戶（見「認證管理」章節）
- 若密碼遺忘，在登入頁面點擊「忘記密碼」或重設用戶密碼

### 前台無法讀取數據

**現象**：頁面顯示「目前尚無內容」或載入超時

**檢查清單**：

1. ✓ Supabase 專案是否仍在線
2. ✓ 相應的表格是否存在（如 `water_home_news`）
3. ✓ 表格是否有數據
4. ✓ RLS 是否允許匿名讀取

**解決**：

```sql
-- 檢查表格是否存在
SELECT * FROM information_schema.tables
WHERE table_name = 'water_home_news';

-- 檢查是否有數據
SELECT COUNT(*) FROM water_home_news;

-- 檢查 RLS 狀態
SELECT * FROM pg_policies
WHERE tablename = 'water_home_news';
```

### 上傳圖片失敗

**現象**：後台上傳照片或編輯圖片時出現錯誤

**檢查清單**：

1. ✓ Supabase Storage bucket 是否存在（`editor-images`, `gallery-images`）
2. ✓ bucket 是否設為公開（public）
3. ✓ 圖片檔案大小是否超過 8 MB
4. ✓ 圖片格式是否支援（JPG, PNG, WEBP, GIF）

**解決**：

進入 Supabase Storage，確認 bucket 設定為公開：

1. 點擊 bucket 名稱
2. 進入 Settings
3. 確認「Make bucket public」已啟用

### GitHub Actions 部署失敗

**現象**：推送到 main 後，GitHub Actions 顯示失敗

**檢查清單**：

1. ✓ GitHub Secrets 中的環境變數是否正確設置
2. ✓ `npm run build` 是否在本機成功
3. ✓ `src/` 和 `public/` 目錄結構是否完整
4. ✓ `.github/workflows/deploy.yml` 是否配置正確

**解決**：

1. 進入 GitHub repo → Actions → 找到失敗的 workflow
2. 點擊檢視日誌
3. 查看具體的錯誤訊息
4. 通常是環境變數缺失，確認 GitHub Secrets 已設置

## 版本控制

### Commit Message 格式

建議遵循簡單的格式：

```
簡要說明，過去式，以「修正」或「新增」開頭

額外詳情（如有）
```

範例：

```
修正首頁最新消息排序錯誤

- 按 is_pinned DESC 再按 date DESC 排序
- 釘選項目會優先顯示在前面
```

### 常用 Git 指令

```bash
# 檢查狀態
git status

# 查看最近提交
git log --oneline -n 10

# 新增所有變更
git add .

# 提交
git commit -m "訊息"

# 推送到遠端
git push origin main

# 拉取最新變更
git pull origin main
```

## 備份與恢復

### Supabase 數據備份

Supabase 提供自動備份。進入控制台 → Project Settings → Backups

- **免費方案**：每日自動備份（保留 7 天）
- **付費方案**：更長的保留期與多個備份點

### 手動導出數據

在 Supabase SQL Editor：

```sql
-- 導出 water_home_news 為 JSON
SELECT json_agg(t) FROM water_home_news t;
```

將結果複製到本機檔案作為備份。

### 手動導入數據

```sql
-- 插入備份的數據
INSERT INTO water_home_news (id, date, title, description, ...)
VALUES (...), (...), ...;
```

## 監控與維護

### 定期檢查項目

| 項目 | 頻率 | 檢查方式 |
|------|------|---------|
| 前台是否正常 | 每天 | 訪問網站 |
| 後台是否可登入 | 每周 | 測試登入 |
| 圖片是否能上傳 | 每月 | 後台新增測試照片 |
| Supabase 配額 | 每月 | Supabase 控制台 |
| GitHub Actions 狀態 | 每次提交後 | GitHub Actions 標籤 |

### 配額監控

進入 Supabase 控制台 → Organization Settings → Billing

- **數據庫容量**：PostgreSQL 數據庫大小
- **儲存容量**：檔案儲存使用量
- **API 調用**：RESTful API 調用次數
- **實時連接**：WebSocket 連接數

若接近上限，考慮升級方案或清理舊數據。

## 緊急情況

### 資料庫損壞

若表格結構被意外破壞，從備份恢復：

1. 進入 Supabase 控制台 → Project Settings → Backups
2. 選擇有效的備份點
3. 點擊「Restore」

### 遺忘後台密碼

1. 進入 Supabase 控制台 → Authentication → Users
2. 找到用戶
3. 點擊用戶，重設密碼
4. 用戶收到重設連結

### 大量數據遺失

若發現數據被誤刪，可使用 Supabase 備份恢復。但需要時間處理。建議：

1. 暫停所有編輯操作
2. 聯繫 Supabase 支援
3. 申請從備份還原

## 相關連結

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase 控制台](https://app.supabase.com)
- [React 官方文檔](https://react.dev)
- [Vite 官方文檔](https://vitejs.dev)
- [GitHub Pages 說明](https://pages.github.com)

## 更新記錄

| 日期 | 變更 | 版本 |
|------|------|------|
| 2026-04-16 | 完成 Supabase 遷移，重新編寫維護文檔 | v2.0 |
