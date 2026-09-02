import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Les types partagés vivent hors du dossier client : on autorise Vite à les lire.
    fs: { allow: ['..'] },
    // Le front appelle /api/... et Vite renvoie vers le serveur Express.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
