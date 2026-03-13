# 維運文件

## 用途

這份文件給後續維護者快速了解：

- 正式站目前如何運作
- 內容要怎麼更新
- Cloudflare 與 GitHub 要檢查哪些點
- 出問題時先從哪裡查

## 目前正式架構

- 前台：GitHub Pages
- 後台頁面：正式站 /#/admin
- 後台 API：Cloudflare Worker
- CMS 儲存：GitHub repo 的 public/cms/*.json
- 編輯器圖片：GitHub repo 的 public/images/editor/*

目前使用的是 split CMS 架構，檔案如下：

- public/cms/home.json
- public/cms/media.json
- public/cms/results.json
- public/cms/gallery.json
- public/cms/thankyou.json

## 日常更新內容

建議優先使用正式站後台更新，不要直接在正式環境手改 JSON。

操作順序：

1. 開啟正式站 /#/admin
2. 使用管理員帳密登入
3. 修改內容後按儲存
4. 等待 GitHub Pages 與快取更新
5. 回前台確認畫面

如果只是大量內容整理或要做版本比對，也可以直接修改 public/cms/*.json 後再 push。

補充：

- 文字編輯器可直接上傳圖片
- 圖片上傳後會寫到 public/images/editor/YYYY/MM/*
- 文章內只保存圖片網址，不再把圖片 base64 直接塞進 JSON
- 若圖片已上傳但文章最後沒儲存，可能會留下未使用圖片檔
- 目前支援 JPG、PNG、WEBP、GIF，單張上限 8 MB
- 大於約 2 MB 的 JPG、PNG、WEBP 會先在瀏覽器端自動壓縮後再上傳

## 正式站驗證清單

每次調整後，建議至少確認以下網址：

1. /api/github/status
2. /api/cms
3. /#/admin
4. 後台插入圖片是否成功
5. 前台實際頁面

預期結果：

- /api/github/status 會回 JSON
- /api/cms 會回 content 與 shas
- /#/admin 可登入、可載入、可儲存
- 編輯器插入圖片後，內容中應出現 /images/editor/... 路徑
- 前台能讀到更新後內容

## Cloudflare 需要保留的關鍵設定

Worker 設定檔在 worker/wrangler.toml，目前應維持：

- name = ntpcwsa-cms-api
- DATA_ROOT = public/cms
- route = ntpcwsa.org/api/*

Cloudflare Git 連動部署應確認：

1. Repository 是 ntpcwatersafety/WebSite
2. Branch 是 main
3. Root directory 是 worker
4. Route 是 ntpcwsa.org/api/*

Secrets：

- ADMIN_USER
- ADMIN_PASS
- JWT_SECRET
- GITHUB_TOKEN

Vars：

- OWNER = ntpcwatersafety
- REPO = WebSite
- BRANCH = main
- DATA_ROOT = public/cms
- IMAGE_UPLOAD_ROOT = public/images/editor
- JWT_EXPIRES_IN = 8h

## 常見問題先查哪裡

### 1. 後台打不開或登入失敗

先查：

- /api/github/status
- Cloudflare Worker 是否成功部署
- ADMIN_USER、ADMIN_PASS、JWT_SECRET 是否還在

### 2. /api 打到前台 HTML

先查：

- Cloudflare Route 是否仍是 ntpcwsa.org/api/*
- Git 部署 Root directory 是否誤設成 repo 根目錄

### 3. 可以登入但不能儲存

先查：

- GITHUB_TOKEN 是否有效
- /api/cms 是否回傳 shas
- 使用者是否拿舊頁面操作，碰到版本衝突

### 4. 圖片上傳失敗

先查：

- 是否已登入後台
- /api/upload-image 是否回 200
- GITHUB_TOKEN 是否仍可寫入 repo
- 單張圖片是否過大

### 5. 前台沒更新

先查：

- GitHub 上 public/cms/*.json 是否已更新
- GitHub Pages 是否已完成部署
- 瀏覽器或 Cloudflare 是否有快取

## Repo 現況

截至 2026-03-13，repo 狀態如下：

- 舊的本機 Node 管理代理已移除
- CMS 單一檔 cms-data.json 已移除
- 目前唯一維護中的後台 API 是 worker/index.js
- worker/index.js 內保留少量舊環境變數 fallback，屬於相容設計，可保留

## 建議維護原則

1. 日常內容更新優先走正式站後台
2. 架構變更先在本機測 npm run build
3. 動到 Worker 設定時，同步檢查 Cloudflare Route 與 Root directory
4. 不要把正式流程再改回單一 cms-data.json