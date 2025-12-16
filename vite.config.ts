import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // 使用自訂網址時改成 '/'，使用 GitHub Pages 子路徑時用 '/WebSite/'
    const base = '/';  // ← 如果有自訂網址，用這個
    // const base = '/WebSite/';  // ← 如果用 GitHub Pages 預設網址，用這個
    
    return {
      base: base,
      publicDir: 'public',
      server: {
        port: 3000,
        host: '0.0.0.0',
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
