#!/usr/bin/env node
/**
 * deploy:baobab — manual production deploy of the BAOBAB demo site to
 * baobab.junglestar.org (Cloudflare Worker, static assets).
 *
 * Ships the committed curated seed (data/library.json) — a small showcase set
 * (English, has a cover, 5-star), not the full local library.
 *
 * What this does:
 *   1. Cleans + builds BAOBAB from the seed (data:sync -> data/library.json)
 *   2. Runs `wrangler deploy` against apps/baobab/wrangler.jsonc
 *
 * Requires `wrangler login` (or CLOUDFLARE_API_TOKEN) beforehand.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const BAOBAB_CONFIG = 'apps/baobab/wrangler.jsonc';

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
    p.on('error', rej);
  });
}

console.log('▸ build BAOBAB from the curated seed (data/library.json)');
await run('pnpm', ['build:baobab'], { cwd: REPO_ROOT });

console.log('▸ wrangler deploy');
await run('wrangler', ['deploy', '-c', BAOBAB_CONFIG], { cwd: REPO_ROOT });
