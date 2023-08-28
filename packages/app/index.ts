import { convertToMergedFlameGraph, type FlameGraphNode } from "cpuprofile-to-flamegraph";
import type { APIGatewayEvent, Context, Callback } from "aws-lambda";
import type { Browser, Page, Protocol } from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import fs from "fs";
import { S3 } from 'aws-sdk';

interface AnalysisEvent extends APIGatewayEvent {
  url: string;
}

interface AnalysisResult {
  title?: string;
  profile?: Protocol.Profiler.StopResponse;
  file?: string;
}

type AnalysisEntry = {
  title: string,
  profile: Protocol.Profiler.StopResponse,
  flamegraph: FlameGraphNode
}

const IS_LAMBDA_ENV = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

const ERROR = {
  statusCode: 500,
  headers: { "Content-Type": "text/plain" },
}


let RUNS = 0;
let RUN_DATA: AnalysisEntry[] = [];

export const handler = async (
  event: AnalysisEvent,
  context: Context,
  callback: Callback
) => {
  let result: AnalysisResult | null = null;

  try {

    await runProfiler()
    const { title, profile } = await medianExecutionTime(RUN_DATA);
    const file = await saveProfile(profile);

    result = {
      title,
      profile,
      file
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
        ...ERROR,
        body: `Could not load ${event.url}: ${error.stack}`,
      };
    }
  }

  return {
    ...ERROR,
    body: `Could not load ${event.url}\n`,
  };
};

async function getPreviousProfile() {
  const s3 = new S3();
  const bucketName = process.env.BUCKET_NAME!;

  const s3Contents = await s3.listObjectsV2({ Bucket: bucketName }).promise();
  
  const latestFile = s3Contents.Contents?.sort((a, b) => {
    if (a.LastModified! < b.LastModified!) {
      return -1;
    }
    if (a.LastModified! > b.LastModified!) {
      return 1;
    }
    return 0;
  })[0];

  const file = await s3.getObject({
    Bucket: bucketName,
    Key: latestFile?.Key!,
  }).promise();

  const profile = JSON.parse(file.Body?.toString()!);

  return profile;
}

async function runProfiler (url: string = "https://boggle.pages.dev/") {
  while (RUNS < 3) {
    const { profile, title } = await profiler(url);
    const flamegraph = convertToMergedFlameGraph(profile.profile as any);

    RUN_DATA.push({ title, profile, flamegraph });
    console.log("execution time", flamegraph.executionTime);
    RUNS++;
  }
}

async function profiler(url: string) {
  let browser: Browser | null = null;

  browser = await chromium.puppeteer.launch({
    headless: "new" as any, // https://developer.chrome.com/articles/new-headless/
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    ignoreHTTPSErrors: true,
  });

  if (browser === null) {
    throw new Error("Browser is null");
  }

  const page: Page = await browser.newPage();
  const title = await page.title();
  const client = await page.target().createCDPSession();

  await client.send("Page.enable");
  await client.send("Profiler.enable");
  await client.send("Profiler.start");
  await page.goto(url);

  const profile: Protocol.Profiler.StopResponse = await client.send(
    "Profiler.stop"
  );

  if (browser !== null) {
    await browser.close();
  }

  return {
    title,
    profile,
  };
} 

async function saveProfile(data: Protocol.Profiler.StopResponse) {
  let fileName = '';

  try {
    if (!IS_LAMBDA_ENV) {
      const date = Date.now();
      fileName = `profile-${date}.cpuprofile`;
      const cpuProf = JSON.stringify(data.profile, null, 2);
      await fs.writeFileSync(fileName, cpuProf)
  
      return fileName
    } else {
      const s3 = new S3();
  
      // Convert the data to JSON format
      const jsonData = JSON.stringify(data.profile);
  
      // Specify the S3 bucket name from the environment variables
      const bucketName = process.env.BUCKET_NAME!;
  
      fileName = `output-${Date.now()}.json`;
  
      // Prepare the parameters for the S3 putObject operation
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: jsonData,
      };
  
      // Upload the data to the S3 bucket
      const response = await s3.putObject(params).promise();
      console.log('S3 response: ');
      console.log(response);

      // get the signed url
      const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: bucketName,
        Key: fileName,
      });
  
      return signedUrl ?? 'could not get signed url'
    }
  } catch (e) {
    return 'did not save profile'
  }
}

const medianExecutionTime = (data: AnalysisEntry[]) => {
  const sorted = data.sort((a, b) => {
    if (a.flamegraph.executionTime < b.flamegraph.executionTime) {
      return -1;
    }
    if (a.flamegraph.executionTime > b.flamegraph.executionTime) {
      return 1;
    }
    return 0;
  });

  const medianIndex = Math.floor(sorted.length / 2);
  return sorted[medianIndex];
}

if (IS_LAMBDA_ENV) {
  console.log("Running in AWS Lambda");
} else {
  handler(
    {
      // url: "http://localhost:3000",
    } as AnalysisEvent,
    {} as Context,
    {} as Callback
  );
}
