import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
