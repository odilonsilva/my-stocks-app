const puppeteer = require('puppeteer');

exports.findStock = async (url) => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(url);

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box
  // await page.type('.search-box__input', 'automate beyond recorder');

  // Wait and click on first result
  const hasError = await page.waitForSelector('.error404', {
    timeout: 500
  }).catch((error) => {
    return false
  });

  if (hasError) {
    console.log('stock not found');
    return false;
  }

  await page.waitForSelector('.quotes-header-info');
  // await page.click(searchResultSelector);

  // Locate the full title with a unique string
  let textSelector = await page.waitForSelector('.quotes-header-info .center h1');
  const titleContent = await textSelector?.evaluate(el => el.textContent);
  
  textSelector = await page.waitForSelector('.quotes-header-info .line-info .value p');
  const valueContent = await textSelector?.evaluate(el => el.textContent);

  textSelector = await page.waitForSelector('.quotes-header-info .line-info .percentage p');
  const percentageContent = await textSelector?.evaluate(el => el.textContent);
  const updated_at = new Date();
  // Print the full title
  stock = {
    url,
    updated_at,
    title: titleContent.trim(),
    value: valueContent.trim(),
    percentage: percentageContent.trim(),
    status: percentageContent.trim().charAt(0) == '+'? 'positive' : 'negative'
  }
  await browser.close();
  // console.log('stock', stock);
  return stock;
};