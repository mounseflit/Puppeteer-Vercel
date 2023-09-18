const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
    };
  }

 
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();

async function scrapeProduct(url, mail, password, year, round) {

    await page.goto(url);

    let loggedIn = false;
    while (!loggedIn) {
        await page.waitForSelector(".item");
        await page.click(".item");

        await page.waitForSelector("#UserName");
        await page.type("#UserName", mail, { delay: 50 }); //mail

        await page.waitForSelector(".item");
        await page.click(".item");

        await page.waitForSelector("#Password");
        await page.type("#Password", password, { delay: 50 }); //password

        await page.waitForSelector(".item");
        await page.click(".item");

        await page.click("#btnSubmit");

        await page.goto("https://waliye.men.gov.ma/moutamadris/General/Home");

        try {
            await Promise.race([
                page.waitForNavigation({ timeout: 5000 }),
                page.waitForSelector("#NoteDiv", { timeout: 5000 }),
            ]);
            loggedIn = true;
        } catch (error) {
            console.error("Login attempt failed. Retrying...");
        }
    }

    await page.goto(
        "https://waliye.men.gov.ma/moutamadris/TuteurEleves/GetNotesEleve"
    );

    await page.waitForSelector("#SelectedAnnee");

    await page.select("#SelectedAnnee", year); // year

    await page.waitForSelector("#SelectedSession");

    await page.select("#SelectedSession", round); //round

    await page.click("#btnSearchNotes");

    await page.waitForSelector("#tab_notes_exam");

    await page.waitForSelector(
        "#ResultBulletin > div > div > div.widgetCont > div.nav-tabs-custom > ul > li:nth-child(2) > a",
        { delay: 5000 }
    );

    await page.click(
        "#ResultBulletin > div > div > div.widgetCont > div.nav-tabs-custom > ul > li:nth-child(2) > a"
    );

    const collectedData = [];

    for (let index = 1; index < 20; index++) {
        try {
            const [wl] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[1]/div/table/tbody/tr[' +
                index +
                "]/td[1]",
                { delay: 100 }
            );
            if (!wl) {
                continue;
            }

            const sub = await wl.getProperty("textContent");
            const subject = await sub.jsonValue();

            const [wll] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[1]/div/table/tbody/tr[' +
                index +
                "]/td[2]",
                { delay: 100 }
            );
            if (!wll) {
                continue;
            }

            const gra = await wll.getProperty("textContent");
            const grade = await gra.jsonValue();

            collectedData.push({ subject, grade });
        } catch (error) {
            console.error(`Error at index ${index}`);
        }
    }

    for (let index = 1; index < 3; index++) {
        try {
            const [wl] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[2]/div[' + index + "]/label",
                { delay: 100 }
            );

            const sub = await wl.getProperty("textContent");
            const subject = await sub.jsonValue();

            const [wll] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[2]/div[' + index + "]/span",
                { delay: 100 }
            );

            const gra = await wll.getProperty("textContent");
            const grade = await gra.jsonValue();

            collectedData.push({ subject, grade });
        } catch (error) {
            console.error(`Error at index ${index}`);
        }
    }



    await new Promise((resolve) => setTimeout(resolve, 5000));

    await page.goto("https://waliye.men.gov.ma/moutamadris/Account/LogOff");

    browser.close();


    const jsonDataString = JSON.stringify(collectedData, null, 2);
    console.log(jsonDataString);
    


 
}






let mail = "R130001518@taalim.ma";
let password = "130569Akram";
let year = "2022";
let round = "2";
res.send(await scrapeProduct(
    "https://waliye.men.gov.ma/moutamadris/Account",
    mail,
    password,
    year,
    round
));

 
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;



