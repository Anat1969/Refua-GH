// Renders icons/icon.svg to the PNG sizes the manifest needs.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, '../icons/icon.svg'), 'utf8');
  const b = await chromium.launch();
  for (const n of [192, 512]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<style>html,body{margin:0}svg{width:${n}px;height:${n}px;display:block}</style>${svg}`);
    await p.screenshot({ path: path.join(__dirname, `../icons/icon-${n}.png`) });
  }
  await b.close();
})();
