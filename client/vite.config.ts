import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Ignore client abort errors when seeking audio/video streams
            if ('writeHead' in res && !res.headersSent) {
              res.writeHead(502);
            }
            if ('end' in res) {
              res.end();
            }
          });
        },
      },
    },
  },
});
