const puppeteer = require('puppeteer');

const {delay} = require('../helpers');

const URL = 'https://fast.com';

async function waitForElement(page, element) {
  const success = await page.evaluate(_element => {
    // eslint-disable-next-line no-undef
    const $ = document.querySelector.bind(document);
    return Boolean($(_element));
  }, element);

  if (!success) {
    await delay(100);
    return waitForElement(page, element);
  }
}

function readSpeedFactory(page) {
  async function getSpeedFromElement(element) {
    return page.evaluate(elem => {
      // eslint-disable-next-line no-undef
      const $ = document.querySelector.bind(document);

      return {
        speed: Number($(`#${elem}-value`).textContent),
        unit: $(`#${elem}-units`).textContent.trim(),
      };
    }, element);
  }

  return async function readSpeed() {
    await waitForElement(page, '#speed-value.succeeded');
    const down = await getSpeedFromElement('speed');

    await waitForElement(page, '.extra-details-container.succeeded');
    const [up, ping] = Promise.all([
      getSpeedFromElement('speed'),
      getSpeedFromElement('upload'),
      getSpeedFromElement('latency')
    ]);

    return {down, up, ping};
  };
}

async function test() {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(URL);

    const readSpeed = readSpeedFactory(page);
    const result = await readSpeed();
    return result;
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = {
  test,

  readSpeedFactory
};
