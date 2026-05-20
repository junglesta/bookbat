#!/usr/bin/env node
/**
 * deploy:baobab — manual production deploy of the BAOBAB Astro site to
 * baobab.junglestar.org with the FULL local library (data/library.full.json).
 *
 * Why a script instead of one pnpm chain:
 *   The Netlify CLI walks up from the cwd looking for `netlify.toml`. When
 *   invoked from `apps/baobab/` it finds the *root* `netlify.toml` (the BOOK
 *   BAT config) and merges it, corrupting the deploy (publish dir + build
 *   command get crossed). Working around that flag-by-flag is brittle.
 *
 * What this does:
 *   1. Cleans + builds BAOBAB with the full dataset
 *   2. Copies the dist into a tmp dir OUTSIDE the repo (no netlify.toml)
 *   3. Runs `netlify deploy --prod --no-build` against the BAOBAB site ID
 *   4. Cleans up the tmp dir
 */
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const BAOBAB_DIST = join(REPO_ROOT, 'apps/baobab/dist');
const BAOBAB_SITE_ID = 'f7853df3-30c1-4b5b-b39b-a1014fe04e80';

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
    p.on('error', rej);
  });
}

const stagingRoot = await mkdtemp(join(tmpdir(), 'baobab-deploy-'));
const stagingSite = join(stagingRoot, 'site');

try {
  console.log('▸ build BAOBAB with full library');
  await run('pnpm', ['build:baobab:full'], { cwd: REPO_ROOT });

  console.log(`▸ stage dist → ${stagingSite}`);
  await cp(BAOBAB_DIST, stagingSite, { recursive: true });

  console.log('▸ netlify deploy --prod');
  await run(
    'netlify',
    ['deploy', '--prod', '--no-build', `--site=${BAOBAB_SITE_ID}`, '--dir=site'],
    { cwd: stagingRoot },
  );
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
