const puppeteer = require("puppeteer");

const baseURL = "https://www.google.com/maps/search/";

const argv = require("minimist")(process.argv.slice(2));

const keywords = argv.search;

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  let page = await browser.newPage();

  await setGoogleLang(page, "en");

  await page.goto(`${baseURL}${keywords}`, {
    waitUntil: "networkidle2",
  });

  let count = 0;
  let end = false;

  for (let index = 0; index < 100; index++) {
    await page.evaluate(scrollPage);

    try {
      await page.waitForFunction(
        `document.querySelectorAll('div[role^="feed"] div[role=article]').length > ${count}`,
        {
          timeout: 10000,
        }
      );
    } catch (error) {
      end = true;
    }

    summary = await page.evaluate(getSummary);

    count = summary.length;
    console.log(`Found ${count} records`);

    if (count >= 120 || end) {
      console.log(summary);

      break;
    }
  }
  await browser.close();
})();

const getSummary = () => {
  const getRatings = (str) => {
    let ratings = parseFloat(str) || 0;
    let reviews = 0;
    if (ratings) {
      const regExp = /\(([^)]+)\)/;
      const matches = regExp.exec(str);
      reviews = parseInt(matches[1]);
    }
    return [reviews, ratings];
  };
  records = Array.from(
    document.querySelectorAll('div[role^="feed"] div[role=article]'),
    (i) => {
      const values = i.innerText.split("\n");
      let [reviews, ratings] = getRatings(values[1]);
      let phoneMaybe = i
        .querySelectorAll("jsl")[3]
        ?.textContent.trim()
        .replace("·", "");
      let phone = null;
      if (parseInt(phoneMaybe?.replace(" ", ""))) {
        phone = phoneMaybe;
      }
      let data = {
        ratings,
        phone,
        reviews,
        name: values[0],
        type: values[2].split("·")[0],
        address: values[2].split("·")[1],
        map: i.querySelector("a").href,
        web: i.querySelector("span img")?.parentElement?.parentElement?.href,
      };
      return data;
    }
  );
  return records;
};

const setGoogleLang = async (page, lang) => {
  await page.goto("https://www.google.com", {
    waitUntil: "networkidle2",
  });
  let home = await page.evaluate(
    () => document.querySelector('a[href*="setprefs"]').href
  );

  home = home
    .split("&")
    .map((i) => {
      if (i.includes("hl=")) {
        i = `hl=${lang}`;
      }
      return i;
    })
    .join("&");

  await page.goto(home, { waitUntil: "networkidle2" });
};

const clickOnResult = async (page, index) => {
  await page.evaluate(() => {
    document
      .querySelectorAll('div[role^="feed"] div[role=article] a')
      [index].click();
  }, index);
  return page;
};

const scrollPage = () => {
  const scrollableSection = document.querySelector('div[role^="feed"]');
  scrollableSection.scrollTop += scrollableSection.offsetHeight + 1000;
};

const getValues = () => {
  Array.from(temp0.querySelectorAll("[data-item-id]"), (i) => ({
    key: i.getAttribute("data-item-id"),
    value: i.textContent.trim(),
  }));
};

const getOpenHours = () => {
  document.querySelector('div[jsaction*="openhours"]').click();
  setTimeout(() => {
    return Array.from(
      document
        .querySelector('div[jsaction*="openhours"]')
        .nextElementSibling.querySelectorAll("tr")
    ).reduce((p, i) => {
      [key, value] = i.innerText.trim().split("\n\t");
      p[key.trim().toLowerCase()] = value.trim();
      return p;
    }, {});
  }, 5);
};
