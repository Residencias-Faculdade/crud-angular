import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const browserDir = 'dist/posts-crud/browser';

if (!existsSync(browserDir)) process.exit(0);

const mainHashed = readdirSync(browserDir).find((name) => /^main[-.][a-zA-Z0-9]+\.js$/.test(name));

if (!mainHashed) process.exit(0);

const stablePath = join(browserDir, 'main.js');
copyFileSync(join(browserDir, mainHashed), stablePath);

const manifest = {
  main: mainHashed,
  generatedAt: new Date().toISOString(),
};

writeFileSync(join(browserDir, 'microfrontend.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(browserDir, 'main.js.json'), JSON.stringify({ file: mainHashed }, null, 2));

const csrIndex = join(browserDir, 'index.csr.html');
const rootIndex = join(browserDir, 'index.html');

if (existsSync(csrIndex)) copyFileSync(csrIndex, rootIndex);

for (const htmlPath of findHtmlFiles(browserDir)) {
  const html = readFileSync(htmlPath, 'utf8').replaceAll(mainHashed, 'main.js');
  writeFileSync(htmlPath, html);
}

function findHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) return findHtmlFiles(entryPath);

    return entry.name.endsWith('.html') ? [entryPath] : [];
  });
}
