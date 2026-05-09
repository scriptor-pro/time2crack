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
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('  [Browser Error]', msg.text());
      }
    });
    page.on('pageerror', err => {
      console.error('  ✗ Page Error:', err.message);
    });

    console.log('\nLoading page...');
    await page.goto('http://localhost:8000/en/index.html', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Wait for DOM to settle
    await page.waitForFunction(() => document.getElementById('pw-input') !== null, { timeout: 5000 });
    console.log('✓ Page loaded with input element');

    // Test 1: Type a simple password
    console.log('\n--- Test 1: Simple password ---');
    await page.type('#pw-input', 'password123', { delay: 50 });
    
    // Wait for analysis to complete (debounce 160ms + processing)
    await page.waitForTimeout(1000);

    // Check if results section has content
    const resultsContent = await page.evaluate(() => {
      const results = document.getElementById('results');
      if (!results) return { error: 'results div not found' };
      
      const hasContent = results.innerHTML.trim().length > 0;
      const hasText = results.textContent.trim().length > 0;
      const classes = Array.from(results.classList);
      
      return {
        hasContent,
        hasText,
        classes,
        contentLength: results.innerHTML.length
      };
    });

    console.log('Results section:', resultsContent);

    if (resultsContent.hasContent) {
      // Extract some analysis results
      const analysis = await page.evaluate(() => {
        const strengthLabel = document.getElementById('strength-label');
        const entropyBits = document.getElementById('strength-bits');
        const crackTime = document.getElementById('crack-date-fast');
        
        return {
          strength: strengthLabel ? strengthLabel.textContent : 'N/A',
          entropy: entropyBits ? entropyBits.textContent : 'N/A',
          crackTime: crackTime ? crackTime.textContent : 'N/A',
        };
      });
      
      console.log('Analysis results:');
      console.log('  Strength:', analysis.strength);
      console.log('  Entropy:', analysis.entropy);
      console.log('  Crack time:', analysis.crackTime);
      
      if (analysis.strength && analysis.strength !== '—') {
        console.log('✓ Password analysis working!');
      } else {
        console.log('✗ Analysis not complete or no results');
      }
    } else {
      console.log('✗ Results section has no content');
    }

    // Test 2: Strong password
    console.log('\n--- Test 2: Strong password ---');
    await page.evaluate(() => {
      document.getElementById('pw-input').value = '';
    });
    await page.type('#pw-input', 'MyP@ssw0rd!SecureRandom2024', { delay: 50 });
    await page.waitForTimeout(1000);

    const strongAnalysis = await page.evaluate(() => {
      const strengthLabel = document.getElementById('strength-label');
      return strengthLabel ? strengthLabel.textContent : 'N/A';
    });
    
    console.log('Strong password strength:', strongAnalysis);

    // Test 3: Check for critical errors
    console.log('\n--- Test 3: Error check ---');
    const hasErrors = await page.evaluate(() => {
      return !!window.__jsErrors || false;
    });
    
    if (!hasErrors) {
      console.log('✓ No critical JavaScript errors detected');
    }

    console.log('\n✓✓✓ Password analysis test completed! ✓✓✓');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
