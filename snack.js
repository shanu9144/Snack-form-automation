
const puppeteer = require("puppeteer");
const { resolveBrowserAndProfile } = require("./browser-resolver");



(async () => {
  const { browserPath, userDataDir, browserType } = resolveBrowserAndProfile({ log: true });
  let browser;
  if (browserType === 'puppeteer-bundled') {
    // On Render: use Puppeteer's bundled Chromium, headless
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--ozone-platform=x11"
      ]
    });
  } else if (browserPath && userDataDir) {
    // Local: use system browser and user profile
    browser = await puppeteer.launch({
      headless: true,
      executablePath: browserPath,
      userDataDir: userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--ozone-platform=x11"
      ],
      env: {
        ...process.env,
        DISPLAY: process.env.DISPLAY || ':0',
        XDG_SESSION_TYPE: 'x11'
      }
    });
  } else {
    console.error("No supported browser/profile found. Exiting.");
    process.exit(1);
  }

  const page = await browser.newPage();

  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScHdUb9m5eooqH5OJGvGpyE4eSsN3ao9WSQHCqXZ6I2OX6bLA/viewform?usp=header";
  await page.goto(FORM_URL, { waitUntil: "networkidle2", timeout: 60000 });

  console.log("Form opened successfully!");
  
  // Wait for the form to be visible (after login, if required)
  let activePage = page;
  let formFound = false;
  const maxWait = 10 * 60 * 1000; // 10 minutes
  const pollInterval = 2000;
  const start = Date.now();
  console.log("Waiting for the form to appear after login (up to 10 minutes)...");
  let pollCount = 0;
  let correctUser = false;
  while (Date.now() - start < maxWait) {
    pollCount++;
    const pages = await browser.pages();
    if (pages.length === 0) {
      console.log(`[Poll ${pollCount}] No open pages left. The browser may have been closed by Google. Please try again or check your login method.`);
      break;
    }
    activePage = pages[pages.length - 1];
    let pageUrl = '';
    try { pageUrl = activePage.url(); } catch (e) { pageUrl = '[unknown]'; }
    console.log(`[Poll ${pollCount}] Checking for form or login on page: ${pageUrl} (Total open pages: ${pages.length})`);
    // Try to get the logged-in email from Google account menu
    let email = null;
    try {
      await activePage.waitForSelector('a[aria-label*="Google Account"], img[aria-label*="Google Account"], img[alt*="Google Account"]', { timeout: pollInterval });
      await activePage.evaluate(() => {
        const btn = document.querySelector('a[aria-label*="Google Account"], img[aria-label*="Google Account"], img[alt*="Google Account"]');
        if (btn) btn.click();
      });
      await activePage.waitForTimeout(1000);
      email = await activePage.evaluate(() => {
        const el = document.querySelector('div[aria-label*="Account Information"], div[aria-label*="Google Account"], [data-email]');
        if (el && el.innerText) {
          const match = el.innerText.match(/[\w.-]+@w3villa.com/);
          if (match) return match[0];
        }
        const all = Array.from(document.querySelectorAll('div, span'));
        for (const node of all) {
          if (node.innerText && node.innerText.endsWith('@w3villa.com')) return node.innerText.trim();
        }
        return null;
      });
      if (email && email.endsWith('@w3villa.com')) {
        correctUser = true;
        console.log(`Logged in as: ${email}`);
      } else {
        console.log('Not logged in as @w3villa.com. Please log in with your organization email.');
      }
    } catch (e) {
      // Could not find account info, keep waiting
    }
    try {
      await activePage.waitForSelector('form', { timeout: 500 });
      formFound = true;
      break;
    } catch (e) {
      // Form not found yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!formFound) {
    console.log("Form did not appear after 10 minutes, or not logged in as @w3villa.com. Please check your login and close the browser manually. The browser will remain open for inspection.");
    while (true) { await new Promise(resolve => setTimeout(resolve, 60000)); }
  }
  console.log("Form is visible and correct user, continuing automation...");

  // Wait for form to fully load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ===== Wait for and Select Checkbox Option =====
  console.log("Waiting for the checkbox label 'opt' to appear...");
  await activePage.waitForFunction(() => {
    return Array.from(document.querySelectorAll('span, div')).some(label => label.textContent.trim() === 'opt');
  }, { timeout: 20000 });

  const clicked = await activePage.evaluate(() => {
    // Find the checkbox for 'opt' by looking for div[role='checkbox'] whose parent contains 'opt'
    const checkboxes = Array.from(document.querySelectorAll('div[role="checkbox"]'));
    for (const checkbox of checkboxes) {
      const parent = checkbox.closest('div[role="listitem"]');
      if (parent && parent.innerText.includes('opt')) {
        checkbox.click();
        return 'clicked-opt-checkbox';
      }
    }
    // Fallback: try any checkbox
    if (checkboxes.length > 0) {
      checkboxes[0].click();
      return 'clicked-any-checkbox';
    }
    return null;
  });
  console.log("Clicked using:", clicked);

  // ===== Wait for and Click Submit =====
  console.log("Waiting for the submit button to appear and be enabled...");
  await activePage.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
    return buttons.some(btn => (btn.textContent.includes('Submit') || btn.textContent.includes('submit')) && !btn.hasAttribute('aria-disabled'));
  }, { timeout: 20000 });

  await new Promise(resolve => setTimeout(resolve, 1000));
  const submitClicked = await activePage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
    const submitBtn = buttons.find(btn => (btn.textContent.includes('Submit') || btn.textContent.includes('submit')) && !btn.hasAttribute('aria-disabled'));
    if (submitBtn) {
      submitBtn.click();
      return true;
    }
    return false;
  });
  console.log("Submit button clicked:", submitClicked);

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("🎉 Form Submitted Successfully!");

  await browser.close();
})();
