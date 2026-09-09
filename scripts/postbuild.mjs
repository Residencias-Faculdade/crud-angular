/**
 * COMPATIBILIDADE COM ATIVIDADENGX - postbuild
 * ARQUIVO NOVO. Angular com outputHashing:all gera main-ABC123.js hasheado.
 * A shell atividadengx espera URL estavel http://localhost:4200/main.js (public/microfrontends.json)
 * Este script copia main-*.js -> main.js e ajusta index.html, garantindo CORS cache correto
 * (nginx.conf serve /main.js como no-cache e chunks hasheados como immutable).
 * Executado via package.json "build": "ng build && node scripts/postbuild.mjs"
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const browserDir = 'dist/primeiro-projeto/browser';
if (!existsSync(browserDir)) process.exit(0);

const files = readdirSync(browserDir);
const mainHashed = files.find((name) => /^main[-.][a-zA-Z0-9]+\.js$/.test(name));

if (!mainHashed) process.exit(0);

const hashedPath = join(browserDir, mainHashed);
const stablePath = join(browserDir, 'main.js');
copyFileSync(hashedPath, stablePath);

const manifest = {
  main: mainHashed,
  generatedAt: new Date().toISOString(),
};

writeFileSync(join(browserDir, 'microfrontend.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(browserDir, 'main.js.json'), JSON.stringify({ file: mainHashed }, null, 2));

const indexPath = join(browserDir, 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8');
  html = html.replace(mainHashed, 'main.js');
  writeFileSync(join(browserDir, 'index.html'), html);
}
