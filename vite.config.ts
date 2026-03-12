import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
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
        host: '0.0.0.0'
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
