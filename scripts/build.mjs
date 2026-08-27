/**
 * One build script, one dependency (esbuild). No bundler config to drift.
 *   npm run build   -> dist/ ready to "Load unpacked"
 *   npm run dev     -> same, in watch mode
 *
 * Extension entries build as IIFE (content scripts cannot be ES modules).
 * The panel builds as IIFE too, so the manifest needs no "type": "module".
 */
import { context, build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

await rm(outdir, { recursive: true, force: true });
await mkdir(`${outdir}/panel`, { recursive: true });

const options = {
  entryPoints: {
    'service-worker': 'extension/background/service-worker.ts',
    'content-script': 'extension/content/content-script.ts',
    'panel/panel': 'panel/main.tsx',
  },
  outdir,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  jsx: 'automatic',
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
};

function buildApi() {
  execFileSync(process.execPath, ['scripts/build-api.mjs'], { stdio: 'inherit' });
}

async function copyStatic() {
  await cp('extension/manifest.json', `${outdir}/manifest.json`);
  await cp('extension/content/bubble.css', `${outdir}/bubble.css`);
  await cp('panel/index.html', `${outdir}/panel/index.html`);
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  await copyStatic();
  console.log('watching — dist/ is loadable at chrome://extensions');
} else {
  await build(options);
  await copyStatic();
  buildApi();
  console.log('built dist/ and api/coach.js');
}
