import { chromium } from 'playwright';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public', 'favicon.png');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap"
    />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 512px;
        height: 512px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #3730a3;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      }
      .mark {
        width: 320px;
        height: 320px;
        border-radius: 9999px;
        background: #fbbf24;
        color: #312e81;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 180px;
        line-height: 1;
        border: 4px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
    </style>
  </head>
  <body>
    <div class="mark" aria-hidden="true">A</div>
  </body>
</html>`;

mkdirSync(dirname(output), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: output, type: 'png' });
await browser.close();

copyFileSync(output, join(root, 'public', 'favicon.ico'));
console.log(`Generated ${output}`);
