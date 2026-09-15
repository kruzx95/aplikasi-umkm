import puppeteer from 'puppeteer-core';

const ARTIFACT_DIR = '/home/kruza/.gemini/antigravity-ide/brain/74ba2e7a-edec-4f12-9108-838ad8c922ed';

async function run() {
  console.log('Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });

  // Wait for React to mount & IndexedDB data to render
  await page.waitForSelector('.brand-title', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: Dashboard (Owner Mode)
  console.log('Capturing Screenshot 1: Dashboard (Owner Mode)...');
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_01_dashboard.png`, fullPage: false });

  // Switch to Superadmin Mode
  console.log('Switching to Superadmin Role...');
  await page.select('.role-select', 'superadmin');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_02_superadmin.png`, fullPage: false });

  // Switch back to Owner Mode
  console.log('Switching back to Owner Role...');
  await page.select('.role-select', 'owner');
  await new Promise(r => setTimeout(r, 1200));

  // Navigate to "Buku Kas"
  console.log('Navigating to Buku Kas...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Buku Kas'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_03_transactions.png`, fullPage: false });

  // Navigate to "Laporan & WA"
  console.log('Navigating to Laporan...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Laporan'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_04_reports_wa.png`, fullPage: false });

  // Navigate to "Audit Log Toko"
  console.log('Navigating to Audit Log...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Audit Log'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_05_audit_log.png`, fullPage: false });

  // Navigate to "Buku Kasbon"
  console.log('Navigating to Buku Kasbon...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Kasbon'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_06_debts.png`, fullPage: false });

  // Open Quick Add Transaction Modal
  console.log('Opening Quick Add Modal...');
  await page.click('.quick-add-btn');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_07_add_transaction_modal.png`, fullPage: false });

  // Close modal with Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Open Kas Laci Shift Modal
  console.log('Opening Kas Laci Shift Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent.includes('Kas Laci'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: `${ARTIFACT_DIR}/shot_08_shift_modal.png`, fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error running test script:', err);
  process.exit(1);
});
