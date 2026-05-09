const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => console.log('  [Browser Console]', msg.text()));
    page.on('error', err => console.error('  [Page Error]', err));
    
    // Capture uncaught errors
    page.on('pageerror', err => {
      console.error('  ✗ Uncaught error in page:', err.message);
    });

    console.log('Loading http://localhost:8000/en/index.html...');
    const response = await page.goto('http://localhost:8000/en/index.html', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    if (!response) {
      throw new Error('Failed to navigate to page');
    }
    
    console.log(`✓ Page loaded with status ${response.status()}`);

    // Wait for state to be initialized
    await page.waitForTimeout(500);

    // Test 1: Check that input element exists
    const inputExists = await page.evaluate(() => {
      return document.getElementById('pw-input') !== null;
    });
    console.log(inputExists ? '✓ Input element exists' : '✗ Input element not found');

    // Test 2: Try typing a password
    console.log('Testing password input...');
    await page.type('#pw-input', 'test123', { delay: 100 });
    
    // Wait a bit for the input handler to process
    await page.waitForTimeout(500);

    // Test 3: Check results section
    const resultsSection = await page.evaluate(() => {
      const results = document.getElementById('results');
      return results ? {
        exists: true,
        hasContent: results.innerHTML.length > 0,
        classList: Array.from(results.classList)
      } : null;
    });
    
    if (resultsSection) {
      console.log('✓ Results section exists');
      console.log(`  - Has content: ${resultsSection.hasContent}`);
      console.log(`  - Classes: ${resultsSection.classList.join(', ') || 'none'}`);
    } else {
      console.log('✗ Results section not found');
    }

    // Test 4: Check for JavaScript errors
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (errors.length === 0) {
      console.log('✓ No JavaScript errors detected');
    } else {
      console.log('✗ JavaScript errors found:', errors);
    }

    console.log('\n✓✓✓ Browser test completed successfully! ✓✓✓');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
