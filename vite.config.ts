// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/japede-cardapio/', 
  envPrefix: 'NEXT_PUBLIC_', // This ensures variables starting with NEXT_PUBLIC_ are exposed
});
