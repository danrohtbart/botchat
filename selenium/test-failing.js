const { Builder, By, until } = require('selenium-webdriver');

(async function alwaysFailingTest() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://google.com');
    await driver.wait(until.elementLocated(By.id('non-existent-element')), 1000);
  } finally {
    await driver.quit();
  }
})();
