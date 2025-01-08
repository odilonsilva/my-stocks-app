const puppeteer = require('puppeteer');

exports.findStock = async (url) => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: 'new' });
  const isFII = url.includes('fii');

  try {
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto(url);

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });
    // Wait and click on first result
    const notFound = await page.waitForSelector('.error404', { timeout: 500 }).catch(() => false);

    if (notFound) {
      await browser.close();
      return false;
    }

    // Locate the full title with a unique string
    let textSelector = isFII ? await page.waitForSelector('.cotacoes__header-title h1', { timeout: 500 }) :
      await page.waitForSelector('.quotes-header-info .center h1', { timeout: 500 });
    const titleContent = await textSelector?.evaluate(el => el.textContent);

    textSelector = isFII ? await page.waitForSelector('.cotacoes__header-price>span', { timeout: 500 }) :
      await page.waitForSelector('.quotes-header-info .line-info .value p', { timeout: 500 });
    const valueContent = await textSelector?.evaluate(el => el.textContent);

    textSelector = isFII ? await page.waitForSelector('.cotacoes__header-change span', { timeout: 500 }) :
      await page.waitForSelector('.quotes-header-info .line-info .percentage p', { timeout: 500 });
    const percentageContent = await textSelector?.evaluate(el => el.textContent);

    let stockSignalContent;
    if (isFII) {
      const stockSignal = await page.waitForSelector('.cotacoes__header-change i', { timeout: 500 });
      stockSignalContent = await stockSignal?.evaluate(el => el.textContent);
    }

    const updated_at = new Date();
    const value = valueContent.trim() === '-' ? 0 : valueContent.trim();
    const percentage = percentageContent.replace(',', '.')
      .replaceAll(/[-+%]/g, '').trim();
    const percentageValue = isNaN(percentage) || percentage == '' ? 0 : parseFloat(percentage);
    const percentageSign = isFII ? stockSignalContent.trim() : percentageContent.trim().charAt(0);
    const isNeutral = percentageContent.trim().charAt(1) === '';
    let status;

    if (percentageSign === '+' || percentageSign === 'arrow_upward') {
      status = 'positive';
    } else if ((percentageSign === '-' || percentageSign === 'arrow_downward') && !isNeutral) {
      status = 'negative';
    } else {
      status = 'neutral';
    }

    stock = {
      url,
      updated_at,
      status,
      value,
      title: titleContent.trim(),
      percentage: percentageValue
    }

    await browser.close();
    return stock;
  } catch (error) {
    console.error(error);
    await browser.close();
    return false;
  }
};
