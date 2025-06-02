// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/japede-cardapio/', // Você já tem isso para o GitHub Pages
  envPrefix: 'NEXT_PUBLIC_', // Adicione esta linha
});