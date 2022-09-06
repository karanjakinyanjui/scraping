const puppeteer = require("puppeteer");
const fs = require("fs");

const APARTMENTS_URL = "https://www.hansimmo.be/te-koop/appartementen";

const PAGE_URL = "https://www.hansimmo.be/woning-te-koop-in-antwerpen/11013";

const getUrls = () => {
  return Array.from(
    document.querySelectorAll("#properties__list a[href]"),
    (i) => i.href
  );
};

const getData = () => {
  const title = document.querySelector("h2").innerText;
  const description = document.querySelector("#description").innerText;
  const address = document.querySelector(".address").innerText;
  const price = document.querySelector(".details-content div dd").innerText;

  return {
    description,
    title,
    price,
    address,
  };
};

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(APARTMENTS_URL);

  let urls = [];

  while (true) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    urls = await page.evaluate(getUrls);
    try {
      await page.waitForFunction(
        `document.querySelectorAll("#properties__list a[href]") > ${urls.length}`,
        { timeout: 5 }
      );
    } catch (error) {
      break;
    }
  }

  const items = [];
  console.log(urls.length);

  for (const url of urls) {
    await page.goto(url);
    try {
      items.push(await page.evaluate(getData));
    } catch (error) {
      console.log(`Error: ${url} skipped`);
    }
  }

  await browser.close();
  return items;
};

main().then((data) => {
  fs.writeFileSync("housing.json", JSON.stringify(data));
  console.log(data.length);
});
