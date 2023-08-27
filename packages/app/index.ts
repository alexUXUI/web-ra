import chromium from "chrome-aws-lambda";
import type { APIGatewayEvent, Context, Callback } from "aws-lambda";
import type { Browser, Page, Protocol } from "puppeteer-core";

interface RaEvent extends APIGatewayEvent {
  url: string;
}

interface RaResult {
  title: string;
  // profile: Protocol.Profiler.TakePreciseCoverageResponse | any;
  profile: Protocol.Profiler.Profile | any;
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
    const title = await page.title();

    // Create a Chrome Devtools Protocol session
    const client = await page.target().createCDPSession();

    // Enable CDP domains
    await client.send("Page.enable");
    await client.send("Profiler.enable");
    await client.send("Audits.enable");
    await client.send("Performance.enable");

    // await client.send("Profiler.startPreciseCoverage", {
    //   callCount: true,
    //   detailed: true,
    // });

    await client.send("Profiler.start");

    const url = event?.url ?? "https://boggle.pages.dev/";

    await page.goto(url);

    // const profile: Protocol.Profiler.TakePreciseCoverageResponse =
    //   await client.send("Profiler.takePreciseCoverage");

    // console.log(profile);

    const profile: Protocol.Profiler.StopResponse = await client.send(
      "Profiler.stop"
    );

    // console.log(profile);

    // profile.profile.nodes.forEach((node) => {
    //   console.log(node);
    // });

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

const runningInLambda = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

if (runningInLambda) {
  console.log("Running in AWS Lambda");
} else {
  handler(
    {
      url: "http://localhost:3000",
    } as RaEvent,
    {} as Context,
    {} as Callback
  );
}
