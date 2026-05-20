import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = dirname(fileURLToPath(import.meta.url));
const certFile = resolve(__dirname, '../../certs/cert.pem');
const keyFile = resolve(__dirname, '../../certs/key.pem');

function getHttpsConfig() {
  if (process.env.WEBAPP_HTTPS !== '1') return undefined;
  if (!existsSync(certFile) || !existsSync(keyFile)) {
    throw new Error(
      'WEBAPP_HTTPS=1 but certs are missing. Run: pnpm certs:generate',
    );
  }
  return {
    cert: readFileSync(certFile),
    key: readFileSync(keyFile),
  };
}

export default defineConfig({
  plugins: [svelte()],
  root: 'src',
  build: {
    outDir: '../../../dist/bookbat',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    https: getHttpsConfig(),
  },
});
