import type { Browser, Page } from "puppeteer-core";

const chromium = require("chrome-aws-lambda");

import { APIGatewayEvent, Context, Callback } from "aws-lambda";

interface RaEvent extends APIGatewayEvent {
  url: string;
}

export const handler = async (
  event: RaEvent,
  context: Context,
  callback: Callback
) => {
  let result: any = null;
  let browser: Browser | null = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      ignoreHTTPSErrors: true,
    });

    if (browser === null) {
      throw new Error("Browser is null");
    }

    const page: Page = await browser.newPage();
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
      title: `FO REAL CANT BELIEVE: ${title}`,
      loadWithDOM,
      all,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error);
      return callback(error);
    }
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};
