import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // 自動判斷：如果有 CNAME 檔案（自訂網域）用 '/'，否則用 '/WebSite/'
    const hasCNAME = fs.existsSync('public/CNAME');
    const base = hasCNAME ? '/' : '/WebSite/';
    
    console.log(`🌐 部署模式：${hasCNAME ? '自訂網域（根目錄）' : 'GitHub Pages 子目錄'}`);
    console.log(`📁 Base Path: ${base}`);
    
    return {
      base: base,
      publicDir: 'public',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // 代理 /api 到本機後端（啟動 server/index.js 預設監聽 3001）
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, '/api')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
