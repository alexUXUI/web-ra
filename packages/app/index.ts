const chromium = require("chrome-aws-lambda");

export const handler = async (event: any, context: any, callback: Function) => {
  let result: any = null;
  let browser: any = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      ignoreHTTPSErrors: true,
      //   createCDPSession: true,
    });

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send("Network.enable");

    await client.send("Page.enable");

    await client.send("Page.setWebLifecycleState", {
      state: "active",
    });

    await client.on("Page.lifecycleEvent", (event: any) => {
      console.log(event);
    });

    const url = event.url;

    await page.goto(url ?? "https://boggle.pages.dev/");

    await client.on("Page.loadEventFired", () => {
      console.log("Page loaded");
    });

    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );

    const loadWithDOM =
      performanceTiming.domComplete - performanceTiming.navigationStart;

    const all =
      performanceTiming.loadEventEnd - performanceTiming.navigationStart;

    console.log(
      "User can see content for Regular2G ~",
      loadWithDOM / 1000,
      "sec"
    );
    console.log("All Load for Regular2G --", all / 1000, "sec");

    // const content = await page.content();
    const title = await page.title();
    result = {
      // content,
      title: `FO REAL: ${title}`,
    };
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};
