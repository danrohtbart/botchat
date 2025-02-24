const { Builder } = require('selenium-webdriver');

(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://google.com');
  } finally {
    await driver.quit();
  }
})();
