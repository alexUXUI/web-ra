import chromium from "chrome-aws-lambda";
import type { APIGatewayEvent, Context, Callback } from "aws-lambda";
import type { Browser, Page, Protocol } from "puppeteer-core";

interface RaEvent extends APIGatewayEvent {
  url: string;
}

interface RaResult {
  title: string;
  profile: Protocol.Profiler.TakePreciseCoverageResponse;
}

export const handler = async (
  event: RaEvent,
  context: Context,
  callback: Callback
) => {
  let result: RaResult | null = null;
  let browser: Browser | null = null;
  try {
    // Launch headless Chrome via
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      ignoreHTTPSErrors: true,
    });

    if (browser === null) {
      throw new Error("Browser is null");
    }

    // Create a Page context
    const page: Page = await browser.newPage();

    // Create a Chrome Devtools Protocol session
    const client = await page.target().createCDPSession();

    // Enable CDP domains
    await client.send("Page.enable");
    await client.send("Profiler.enable");

    await client.send("Page.setWebLifecycleState", {
      state: "active",
    });

    await client.on("Page.lifecycleEvent", (event: any) => {
      console.log(event);
    });

    const url = event.url;

    await client.send("Profiler.startPreciseCoverage", {
      callCount: true,
      detailed: true,
    });

    await page.goto(url ?? "https://boggle.pages.dev/");

    await client.on("Page.loadEventFired", () => {
      console.log("Page loaded");
    });

    const profile: Protocol.Profiler.TakePreciseCoverageResponse =
      await client.send("Profiler.takePreciseCoverage");

    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );

    const title = await page.title();

    result = {
      title,
      profile,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "text/plain" },
        body: `Could not load ${event.url}: ${error.stack}\n`,
      };
    }
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain" },
    body: `Could not load ${event.url}\n`,
  };
};
