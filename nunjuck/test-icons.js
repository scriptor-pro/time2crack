const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:9000/en/', { waitUntil: 'networkidle2' });

  // Test weak password
  await page.click('#pw-input');
  await page.type('#pw-input', '123', { delay: 50 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  const weakData = await page.evaluate(() => {
    const icon = document.querySelector('#best-attack-icon')?.textContent;
    const time = document.querySelector('#best-attack-time')?.textContent;
    const attack = document.querySelector('#best-attack-name')?.textContent;
    return { icon, time, attack };
  });
  
  console.log('WEAK (123):', weakData);

  // Clear and test moderate
  await page.click('#pw-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#pw-input', 'Password123', { delay: 50 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  const moderateData = await page.evaluate(() => {
    const icon = document.querySelector('#best-attack-icon')?.textContent;
    const time = document.querySelector('#best-attack-time')?.textContent;
    const attack = document.querySelector('#best-attack-name')?.textContent;
    return { icon, time, attack };
  });
  
  console.log('MODERATE (Password123):', moderateData);

  // Clear and test strong
  await page.click('#pw-input');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#pw-input', 'MySecur3P@ssw0rd!LongOne', { delay: 50 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  const strongData = await page.evaluate(() => {
    const icon = document.querySelector('#best-attack-icon')?.textContent;
    const time = document.querySelector('#best-attack-time')?.textContent;
    const attack = document.querySelector('#best-attack-name')?.textContent;
    return { icon, time, attack };
  });
  
  console.log('STRONG (MySecur3P@ssw0rd!LongOne):', strongData);

  await browser.close();
})();
