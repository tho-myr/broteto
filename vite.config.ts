import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    assetsDir: 'assets',
  },
  server: {
    host: true,
    allowedHosts: ['localhost', 'broteto.netlify.app', 'devserver-develop--broteto.netlify.app']
  }
});
