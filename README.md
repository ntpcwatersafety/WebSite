# 新北市水上安全協會網站

這個專案是 React + Vite 的靜態網站，部署方式是 GitHub Pages。前台內容主要來自 public/cms-data.json；管理後台則是前端介面。若要在正式站使用後台登入與發布，建議搭配 Cloudflare Worker 提供 /api。

README 以下內容只描述目前 repo 內程式碼可以直接確認的行為，不額外假設站外基礎設施。

## 架構摘要

- 前台是靜態網站，路由使用 HashRouter
- 前台內容主要讀取 public/cms-data.json
- 後台入口是 /#/admin
- server/index.js 是本機或 Node 環境下的管理 API 版本
- worker/index.js 是 Cloudflare Worker 版本，適合正式站免費部署 /api
- GitHub Actions 會在 push 到 main 後 build 並部署 dist

## 資料來源

前台資料載入邏輯在 services/cmsLoader.ts，流程如下：

1. 先呼叫 /api/github/status 檢查是否有可用的後端代理與 GitHub Token
2. 如果可用，透過 /api/cms 讀取 GitHub Repository 內的 cms-data.json
3. 如果不可用，回退讀取 public/cms-data.json

因此這個專案的實際模式是：

- 沒有後端時，前台仍可用，直接讀本地 JSON
- 有後端且已設定 GitHub Token 時，後台可以編輯並同步 GitHub 上的 JSON

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
- 內容會讀取 public/cms-data.json
- /api 相關功能不保證可用

### 跑前台加管理代理

先啟動後端：

```bash
npm run start:server
```

再啟動前端：

```bash
npm run dev
```

前端在開發模式下會把 /api proxy 到 http://localhost:3001。

這個模式下可以測試：

- /api/login
- /api/verify-token
- /api/github/status
- /api/cms

## 後端環境變數

server/index.js 會使用以下環境變數：

- ADMIN_USER
- ADMIN_PASS
- JWT_SECRET
- JWT_EXPIRES_IN
- GITHUB_TOKEN
- OWNER 或 GITHUB_OWNER
- REPO 或 GITHUB_REPO
- BRANCH 或 GITHUB_BRANCH
- DATA_PATH 或 GITHUB_DATA_PATH

其中 ADMIN_USER、ADMIN_PASS、JWT_SECRET 為登入必要設定，未提供時後端會拒絕 /api/login、/api/verify-token、/api/cms 相關請求。

本機 PowerShell 設定範例：

```powershell
$env:ADMIN_USER = 'your-admin-user'
$env:ADMIN_PASS = 'your-admin-password'
$env:JWT_SECRET = 'replace-with-a-long-random-secret'
$env:GITHUB_TOKEN = 'ghp_xxx'
$env:OWNER = 'ntpcwatersafety'
$env:REPO = 'WebSite'
$env:BRANCH = 'main'
$env:DATA_PATH = 'public/cms-data.json'
npm run start:server
```

/api/github/status 會回傳：

- hasToken：是否已設定 GITHUB_TOKEN
- authConfigured：是否已完整設定 ADMIN_USER、ADMIN_PASS、JWT_SECRET
- missingAuthEnvVars：缺少哪些登入相關環境變數

## 內容更新方式

### 方式一：直接改 JSON

直接修改 public/cms-data.json，然後重新部署。

適合：

- 單純更新內容
- 不需要登入後台
- 不需要透過 GitHub API 寫回

### 方式二：使用管理後台

管理後台在 /#/admin。

實際行為如下：

1. 先透過 /api/login 登入
2. 後台載入資料時，優先嘗試從 /api/cms 讀 GitHub 版本
3. 如果 GitHub 代理不可用，會回退讀取本地 cms-data.json
4. 按下儲存時，會呼叫 /api/cms 將內容寫回 GitHub

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
3. GitHub Repository 儲存 cms-data.json

專案已提供：

- worker/index.js：Cloudflare Worker 版 API
- worker/wrangler.toml.example：Wrangler 設定範例

建議部署方式：

1. 將 worker/index.js 部署為 Cloudflare Worker
2. 在 Cloudflare 將 ntpcwsa.org/api/* 路由指向該 Worker
3. 設定下列 secrets / vars：
	- ADMIN_USER
	- ADMIN_PASS
	- JWT_SECRET
	- GITHUB_TOKEN
	- OWNER
	- REPO
	- BRANCH
	- DATA_PATH
	- JWT_EXPIRES_IN

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

## 本次檢查結果

依目前本機檢查結果：

- npm run build 可成功完成
- 前端開發站可正常啟動
- 後端 server/index.js 可正常啟動
- /api/login 可正常回應
- /api/github/status 目前顯示沒有 GitHub Token，且若未提供登入必要環境變數，會一併回報缺少的欄位

這表示目前 repo 狀態正常，但若要讓管理後台把內容寫回 GitHub，仍需要額外配置 GITHUB_TOKEN 與對應的 Repository 設定。

## 常用指令

```bash
npm install
npm run dev
npm run start:server
npm run build
npm run preview
```
