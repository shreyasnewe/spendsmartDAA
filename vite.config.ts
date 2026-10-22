import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';
import { defineConfig, Plugin } from 'vite';

function cppBackendPlugin(): Plugin {
  return {
    name: 'cpp-backend-starter',
    configureServer() {
      const binPath =
        process.platform === 'win32'
          ? path.resolve(__dirname, 'backend/spendsmart_server.exe')
          : path.resolve(__dirname, 'backend/spendsmart_server');

      if (!fs.existsSync(binPath)) {
        return;
      }

      const req = http.get('http://127.0.0.1:5000/api/health', () => {
        // C++ backend is already running on port 5000
      });

      req.on('error', () => {
        try {
          const child = spawn(binPath, ['5000'], {
            detached: true,
            stdio: 'ignore',
            cwd: path.resolve(__dirname, 'backend'),
          });
          child.unref();
        } catch {
          // Ignore
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cppBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
