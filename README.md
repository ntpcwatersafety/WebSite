# 新北市水上安全協會網站

這個專案是 React + Vite 的靜態網站，部署方式是 GitHub Pages。前台內容主要來自 public/cms/*.json；管理後台則是前端介面。若要在正式站使用後台登入與發布，建議搭配 Cloudflare Worker 提供 /api。

README 以下內容只描述目前 repo 內程式碼可以直接確認的行為，不額外假設站外基礎設施。

## 目前狀態

- 2026-03-13 已完成正式站驗證
- 正式站前台、後台登入、Cloudflare Worker API、CMS 讀取與 CMS 儲存皆可正常運作
- 正式站 /api/cms 已採用 split CMS 格式，回傳 content + shas
- 後台文字編輯器已支援直接上傳圖片到 repo 檔案路徑，並提供公告框與提醒框樣板
- 後續維運建議先閱讀 docs/MAINTENANCE.md

## 架構摘要

- 前台是靜態網站，路由使用 HashRouter
- 前台內容主要讀取 public/cms/*.json
- 後台入口是 /#/admin
- worker/index.js 是 Cloudflare Worker 版本，適合正式站免費部署 /api
- GitHub Actions 會在 push 到 main 後 build 並部署 dist

## 資料來源

前台資料載入邏輯在 services/cmsLoader.ts，流程如下：

1. 先呼叫 /api/github/status 檢查是否有可用的後端代理與 GitHub Token
2. 如果可用，透過 /api/cms 讀取 GitHub Repository 內的 public/cms/*.json 並由 Worker 整合
3. 如果不可用，回退讀取 public/cms/*.json

因此這個專案的實際模式是：

- 沒有後端時，前台仍可用，直接讀本地 JSON
- 有後端且已設定 GitHub Token 時，後台可以編輯並同步 GitHub 上的多個 JSON 檔

## 路由

- /#/ : 首頁
- /#/activities : 訓練與活動
- /#/results : 訓練成果
- /#/gallery : 活動剪影
- /#/media : 媒體報導
- /#/thankyou : 感恩有您
- /#/contact : 聯絡我們
- /#/admin : 管理後台

## 本機開發

### 安裝

```bash
npm install
```

### 只跑前台

```bash
npm run dev
```

Vite 設定在 3000 port，因此本機通常是：

- http://localhost:3000/
- http://127.0.0.1:3000/

這個模式下：

- 前台頁面可正常瀏覽
- 內容會讀取 public/cms/*.json
- /api 相關功能不保證可用

### 本機與正式站差異

目前 repo 已移除本機 Node 管理代理，正式站統一使用 Cloudflare Worker 提供 /api。

這表示：

- 本機執行 npm run dev 時，前台仍可正常瀏覽
- 本機內容會直接讀取 public/cms/*.json
- 本機不提供 /api/login、/api/cms 等管理 API
- 後台登入與發布請在正式站環境測試

## 內容更新方式

### 方式一：直接改 JSON

直接修改 public/cms/*.json，然後重新部署。

適合：

- 單純更新內容
- 不需要登入後台
- 不需要透過 GitHub API 寫回

### 方式二：使用管理後台

管理後台在 /#/admin。

實際行為如下：

1. 先透過 /api/login 登入
2. 後台載入資料時，優先嘗試從 /api/cms 讀 GitHub 版本
3. 如果 GitHub 代理不可用，會回退讀取本地 public/cms/*.json
4. 按下儲存時，會呼叫 /api/cms 將內容拆分後寫回 GitHub

文字編輯器補充：

- 可直接在編輯器內插入圖片
- 圖片會先透過 /api/upload-image 上傳到 repo 的 public/images/editor/*
- 之後內容只會保存圖片網址，不會把整張圖塞進 cms JSON
- 若上傳後沒有儲存文章，repo 內仍可能留下未使用圖片，屬於目前可接受的維運取捨

所以後台的「讀取」有 fallback，但「儲存」需要可用的後端代理與 GitHub Token。

為避免輪流編輯時用舊頁面覆蓋較新的 GitHub 內容，後台發布更新時會帶上 GitHub 檔案版本 sha；如果版本已變更，系統會要求先重新載入最新內容再儲存。

## GitHub Pages 部署

GitHub Actions 設定在 .github/workflows/deploy.yml。

目前 workflow 會在 push 到 main 時：

1. 安裝相依套件
2. 執行 npm run build
3. 上傳 dist
4. 部署到 GitHub Pages

專案存在 public/CNAME，內容是 ntpcwsa.org，因此 Vite build 時會使用根路徑 /。

## Cloudflare Worker 正式後台方案

如果不打算自行維護 Node 主機，正式站建議使用：

1. GitHub Pages 部署前台
2. Cloudflare Worker 提供 /api/login、/api/verify-token、/api/github/status、/api/cms
3. GitHub Repository 儲存 public/cms/*.json 與編輯器上傳的 public/images/editor/*

專案已提供：

- worker/index.js：Cloudflare Worker 版 API
- worker/wrangler.toml：目前 repo 內正式使用的 Worker 設定

建議部署方式：

1. 以 GitHub Repository 連動建立 Cloudflare Worker
2. Repository 指向 ntpcwatersafety/WebSite，Branch 使用 main
3. Root directory 設為 worker
4. 讓 Cloudflare 讀取 worker/index.js 與 worker/wrangler.toml
5. 在 Cloudflare 將 ntpcwsa.org/api/* 路由指向該 Worker
6. 設定下列 secrets / vars：
	- ADMIN_USER
	- ADMIN_PASS
	- JWT_SECRET
	- GITHUB_TOKEN
	- OWNER
	- REPO
	- BRANCH
	- DATA_ROOT
	- IMAGE_UPLOAD_ROOT
	- JWT_EXPIRES_IN

目前 repo 內的 worker/wrangler.toml 已設定：

- Root script: index.js
- Route: ntpcwsa.org/api/*
- OWNER = ntpcwatersafety
- REPO = WebSite
- BRANCH = main
- DATA_ROOT = public/cms
- IMAGE_UPLOAD_ROOT = public/images/editor
- JWT_EXPIRES_IN = 8h

如果 Cloudflare Worker 的 workers.dev 網址打開 /api/github/status 時回到前台首頁，通常代表 Git 部署的 Root directory 設錯，應改為 worker，而不是 repo 根目錄。

建議驗證順序：

1. 先測 workers.dev/api/github/status，確認 Worker 程式本體有回 JSON
2. 再測 ntpcwsa.org/api/github/status，確認正式網域路由已指向 Worker
3. 再測 ntpcwsa.org/api/cms，確認可從 GitHub 讀取整合後的 CMS 內容
4. 最後登入 ntpcwsa.org/#/admin，確認後台可讀取與發布

Wrangler 常用指令範例：

```bash
cd worker
wrangler secret put ADMIN_USER
wrangler secret put ADMIN_PASS
wrangler secret put JWT_SECRET
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

這種架構下：

- 網站畫面仍由 GitHub Pages 提供
- 後台登入與發佈由 Cloudflare Worker 執行
- 維護人員仍可從正式網址的 /#/admin 進行操作

### Cloudflare 實際部署步驟

以下流程是本專案實際驗證可用的設定方式。

1. 在 Cloudflare Workers 建立新的 Git 連動 Worker
2. Repository 選 ntpcwatersafety/WebSite
3. Branch 選 main
4. Root directory 設為 worker
5. 完成首次部署後，確認 workers.dev 網址可開啟

接著在 Worker 設定內補上變數與密鑰。

Vars：

- OWNER = ntpcwatersafety
- REPO = WebSite
- BRANCH = main
- DATA_ROOT = public/cms
- JWT_EXPIRES_IN = 8h

Secrets：

- ADMIN_USER
- ADMIN_PASS
- JWT_SECRET
- GITHUB_TOKEN

之後在 Cloudflare 將 ntpcwsa.org/api/* 設為 Route，指向這個 Worker。

注意：

- 不要把整個 ntpcwsa.org 綁成 Custom Domain 給 Worker
- workers.dev 與預覽網址可以保留，不需要刪除
- 若 workers.dev/api/github/status 出現前台首頁，通常代表 Root directory 設錯成 repo 根目錄

### Cloudflare 驗證清單

建議每次調整後依序檢查：

1. workers.dev/api/github/status
2. ntpcwsa.org/api/github/status
3. ntpcwsa.org/api/cms
4. ntpcwsa.org/#/admin

預期結果：

- workers.dev/api/github/status 應回傳 JSON，而不是前台 HTML
- ntpcwsa.org/api/github/status 應回傳 hasToken、authConfigured、missingAuthEnvVars、backend
- ntpcwsa.org/api/cms 應回傳整合後的 CMS JSON 內容
- /#/admin 應可正常登入、重新載入並儲存內容

### Cloudflare 常見問題

1. workers.dev/api/... 回前台首頁

原因通常是 Git 部署的 Root directory 錯誤。請改成 worker，然後重新部署。

2. ntpcwsa.org/api/... 仍回前台首頁

原因通常是正式網域 Route 尚未正確指向 Worker，請確認使用的是 ntpcwsa.org/api/*，不是 Custom Domain。

3. /api/github/status 顯示 hasToken: false 或 authConfigured: false

代表 Worker 尚未讀到密鑰或登入設定。請重新檢查：

- ADMIN_USER
- ADMIN_PASS
- JWT_SECRET
- GITHUB_TOKEN

4. 有修改設定但找不到重新部署按鈕

若是 Git 連動部署，可直接再 push 一次 commit 觸發重新建置。

## 本次檢查結果

依目前本機檢查結果：

- npm run build 可成功完成
- 前端開發站可正常啟動
- 已移除本機 Node 管理代理與其相依套件
- 已移除未使用的 pages/Media.tsx
- 已移除多餘的 worker/wrangler.toml.example

正式站後續已完成 Cloudflare Worker 佈署驗證，確認：

- ntpcwsa.org/api/github/status 可正常回傳 Cloudflare Worker JSON
- ntpcwsa.org/api/cms 可正常讀取 GitHub 上的 public/cms/*.json
- 正式架構已可採用「GitHub Pages 提供前台 + Cloudflare Worker 提供 /api + GitHub 儲存 CMS JSON」的模式運作
- 正式後台登入與實際儲存已完成人工驗證
- 未授權請求會被 /api/login 與 /api/cms 正確拒絕

## Repo 現況整理

截至 2026-03-13，本地 repo 與目前正式架構一致，檢查結果如下：

- git worktree 乾淨，沒有未提交變更
- 主要 CMS 來源已固定為 public/cms/*.json
- 本機 Node 管理代理已移除，唯一維護中的後台 API 為 worker/index.js
- 掃描 repo 後，沒有發現仍在使用的舊版 cms-data.json、server/index.js 或 wrangler.toml.example 參照
- worker/index.js 仍保留 DATA_PATH 舊參數相容邏輯，這是刻意保留的 fallback，不是殘留垃圾碼

若要交接給下一位維護者，建議搭配 docs/MAINTENANCE.md 一起閱讀。

## 常用指令

```bash
npm install
npm run dev
npm run build
npm run preview
```
