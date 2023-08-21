import chromium from "chrome-aws-lambda";
import type { APIGatewayEvent, Context, Callback } from "aws-lambda";
import type { Browser, Page, Protocol } from "puppeteer-core";

interface RaEvent extends APIGatewayEvent {
  url: string;
}

interface RaResult {
  title: string;
  profile: Protocol.Profiler.TakePreciseCoverageResponse;
  tracing: any;
  issues: any[];
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

    // enable audits
    await client.send("Audits.enable");

    // enable performance
    await client.send("Performance.enable");

    // enable tracing
    await client.send("Tracing.start");

    await client.send("Page.setWebLifecycleState", {
      state: "active",
    });

    const issues: any[] = [];

    // collect audits
    await client.on("Audits.issueAdded", (event: any) => {
      issues.push(event);
      console.log(event);
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

    const tracing = await client.send("Tracing.end");

    const profile: Protocol.Profiler.TakePreciseCoverageResponse =
      await client.send("Profiler.takePreciseCoverage");

    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );

    const title = await page.title();

    const report = await page.evaluate(() => {
      const allEntries = JSON.parse(
        JSON.stringify(window.performance.getEntries())
      );
      return allEntries;
    });

    console.log("report", report);

    result = {
      title,
      profile,
      tracing,
      issues,
    };

    console.log(title);
    console.log("tracing", tracing);
    console.log("issues", issues);

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

handler({} as any, {} as any, {} as any);
