// Export Android/header sizes from the approved Pro artwork (Klaus 2026-10-22: grey rim, light centre like Workflow PDF
// Pro, built by tools/native/icon/make-pro-icon.py from private-brain-pro-light.png); never touch the PWA checkout.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const source = await readFile(new URL('../../artwork/private-brain-pro-grey.png', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CB_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const size of [512, 192]) {
    const png = await page.evaluate(async ({ data, size }) => {
      const image = new Image(); image.src = data; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, size, size);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { data: `data:image/png;base64,${source.toString('base64')}`, size });
    await writeFile(new URL(`../../icon-${size}.png`, import.meta.url), Buffer.from(png, 'base64'));
  }
  // V3: the Android icon is the V3 logo (tools/native/icon/export-v3-android-icon.py), no longer icon-512.png.
} finally { await browser.close(); }
console.log('Light Pro icons exported at 512/192 px (Android keeps the V3 logo).');
