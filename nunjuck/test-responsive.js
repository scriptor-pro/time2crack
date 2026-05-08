#!/usr/bin/env node
const puppeteer = require('puppeteer');

const TEST_CASES = [
  { viewport: { width: 320, height: 800 }, name: '320px (Small Phone)' },
  { viewport: { width: 375, height: 800 }, name: '375px (Standard Phone)' },
  { viewport: { width: 480, height: 800 }, name: '480px (Large Phone)' },
  { viewport: { width: 768, height: 1024 }, name: '768px (Tablet)' },
  { viewport: { width: 1024, height: 768 }, name: '1024px (Desktop)' }
];

const PASSWORDS = [
  { input: '123', expected: '🔓', description: 'Weak password' },
  { input: 'Password123', expected: '🔒', description: 'Moderate password' },
  { input: 'MySecur3P@ssw0rd!LongOne', expected: '🔐', description: 'Strong password' }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPasswordStrength(page, password) {
  // Clear input
  await page.click('#pw-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');

  // Type password
  await page.type('#pw-input', password, { delay: 50 });

  // Wait for results to render
  await sleep(1000);

  // Get results data
  const results = await page.evaluate(() => {
    const resultsSection = document.querySelector('#results');
    if (!resultsSection) return { exists: false };

    const isEmptyClass = resultsSection.classList.contains('is-empty');
    const card = resultsSection.querySelector('.best-attack-card');
    const label = resultsSection.querySelector('.best-attack-card-label');
    const time = resultsSection.querySelector('#best-attack-time');
    const icon = resultsSection.querySelector('#best-attack-icon');
    const badge = resultsSection.querySelector('.best-attack-card-badge-text');

    return {
      exists: true,
      isEmpty: isEmptyClass,
      hasCard: !!card,
      label: label ? label.textContent : null,
      time: time ? time.textContent : null,
      icon: icon ? icon.textContent : null,
      badge: badge ? badge.textContent : null,
      cardVisible: card ? window.getComputedStyle(card).display !== 'none' : false,
      opacity: card ? window.getComputedStyle(resultsSection).opacity : null
    };
  });

  return results;
}

async function checkConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  return errors;
}

async function runTest() {
  console.log('🚀 Starting Best-Attack Card Responsive Testing\n');
  console.log('═'.repeat(80) + '\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const testCase of TEST_CASES) {
      console.log(`\n📱 Testing: ${testCase.name}`);
      console.log('-'.repeat(80));

      const page = await browser.newPage();
      await page.setViewport(testCase.viewport);

      // Collect console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
        }
      });
      page.on('pageerror', error => {
        consoleErrors.push(`[EXCEPTION] ${error.toString()}`);
      });

      await page.goto('http://localhost:9000/en/', { waitUntil: 'networkidle2' });

      // Test empty state
      console.log('\n  ✓ Empty State (No Password):');
      const emptyResults = await page.evaluate(() => {
        const resultsSection = document.querySelector('#results');
        return {
          hasEmptyClass: resultsSection.classList.contains('is-empty'),
          opacity: resultsSection ? window.getComputedStyle(resultsSection).opacity : 'N/A'
        };
      });
      console.log(`    - is-empty class: ${emptyResults.hasEmptyClass ? 'PRESENT' : 'MISSING'} ⚠️`);
      console.log(`    - opacity: ${emptyResults.opacity}`);

      // Test each password
      console.log('\n  ✓ Password Strength Tests:');
      for (const pwTest of PASSWORDS) {
        console.log(`\n    Testing: ${pwTest.description} ("${pwTest.input}")`);
        const results = await testPasswordStrength(page, pwTest.input);

        if (results.exists && results.hasCard) {
          console.log(`      ✓ Best attack card rendered`);
          console.log(`      ✓ Badge: ${results.badge || 'N/A'}`);
          console.log(`      ✓ Label: "${results.label || 'N/A'}"`);
          console.log(`      ✓ Time: "${results.time || 'N/A'}"`);
          console.log(`      ✓ Icon: ${results.icon || 'N/A'}`);
          console.log(`      ✓ Card visible: ${results.cardVisible ? 'YES' : 'NO'}`);
          console.log(`      ✓ Results opacity: ${results.opacity}`);
        } else {
          console.log(`      ✗ Results section issue`);
        }
      }

      // Check for scrollbars
      const scrollCheck = await page.evaluate(() => {
        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
        const hasVerticalScroll = document.documentElement.scrollHeight > window.innerHeight;
        return { hasHorizontalScroll, hasVerticalScroll };
      });
      console.log(`\n  ✓ Scroll Check:`);
      console.log(`    - Horizontal scrollbar: ${scrollCheck.hasHorizontalScroll ? '⚠️ PRESENT' : 'NONE ✓'}`);
      console.log(`    - Vertical scrollbar: ${scrollCheck.hasVerticalScroll ? 'PRESENT' : 'NONE ✓'}`);

      // Language switching test (only on desktop)
      if (testCase.viewport.width >= 768) {
        console.log(`\n  ✓ Language Switching Tests:`);
        for (const lang of LANGUAGES) {
          await page.goto(`http://localhost:9000/${lang.code}/`, { waitUntil: 'networkidle2' });
          await page.click('#pw-input');
          await page.type('#pw-input', 'TestPassword123', { delay: 30 });
          await sleep(500);

          const labelText = await page.evaluate(() => {
            const label = document.querySelector('.best-attack-label');
            return label ? label.textContent : 'N/A';
          });
          console.log(`    - ${lang.name}: Label = "${labelText}"`);
        }
      }

      // Report console errors
      if (consoleErrors.length > 0) {
        console.log(`\n  ⚠️  Console Errors Found:`);
        consoleErrors.forEach(err => console.log(`     ${err}`));
      } else {
        console.log(`\n  ✓ No console errors`);
      }

      await page.close();
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Testing Complete!\n');

  } finally {
    await browser.close();
  }
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
