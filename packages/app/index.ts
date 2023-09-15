import {
  convertToMergedFlameGraph,
  Profile,
  type FlameGraphNode,
} from "cpuprofile-to-flamegraph";
import type { APIGatewayEvent, Context, Callback } from "aws-lambda";
import type { Browser, Page, Protocol } from "puppeteer-core";
import chromium from "chrome-aws-lambda";
import fs from "fs";
import { S3 } from "aws-sdk";

interface AnalysisEvent extends APIGatewayEvent {
  url: string;
}

interface AnalysisResult {
  title?: string;
  diff?: any;
  currentprofile?: Protocol.Profiler.Profile;
  previousProfile?: Protocol.Profiler.Profile;
}

type AnalysisEntry = {
  title: string;
  profile: Protocol.Profiler.Profile;
  flamegraph: FlameGraphNode;
};

const IS_LAMBDA_ENV = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

const ERROR = {
  statusCode: 500,
  headers: { "Content-Type": "text/plain" },
};

let RUNS = 0;
let RUN_DATA: AnalysisEntry[] = [];

export const handler = async (
  event: AnalysisEvent,
  context: Context,
  callback: Callback
) => {
  let result: AnalysisResult | null = null;

  RUNS = 0;
  RUN_DATA = [];

  try {
    await runProfiler(event.url);
    const { title, profile } = await medianExecutionTime(RUN_DATA);
    await saveProfile(profile);
    const previousProfile = await getPreviousProfile();

    let diff = null;
    try {
      const functionSliceDiff = compareProfiles(previousProfile, profile);
      diff = Array.from(functionSliceDiff);
      console.log("diff", diff);
    } catch (e) {
      console.error(e);
    }

    result = {
      title,
      diff,
      currentprofile: profile,
      previousProfile,
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

async function runProfiler(url: string = "https://boggle.pages.dev/") {
  while (RUNS < 3) {
    const { profile, title } = await profiler(url);
    const flamegraph = convertToMergedFlameGraph(profile as Profile);

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

  // close the client
  await client.detach();

  if (browser !== null) {
    await browser.close();
  }

  return {
    title,
    profile: profile.profile,
  };
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
};

async function saveProfile(data: Protocol.Profiler.Profile) {
  let fileName = "";

  try {
    if (!IS_LAMBDA_ENV) {
      const date = Date.now();
      fileName = `profile-${date}.cpuprofile`;
      const cpuProf = JSON.stringify(data, null, 2);
      await fs.writeFileSync(fileName, cpuProf);

      return fileName;
    } else {
      const s3 = new S3();

      const jsonString = JSON.stringify(data);
      const bucketName = process.env.BUCKET_NAME!;

      fileName = `output-${Date.now()}.json`;

      // Prepare the parameters for the S3 putObject operation
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: jsonString,
      };

      // Upload the data to the S3 bucket
      const response = await s3.putObject(params).promise();

      // get the signed url
      const signedUrl = await s3.getSignedUrlPromise("getObject", {
        Bucket: bucketName,
        Key: fileName,
      });

      return signedUrl ?? "could not get signed url";
    }
  } catch (e) {
    return "did not save profile";
  }
}

async function getPreviousProfile() {
  if (IS_LAMBDA_ENV) {
    try {
      const s3 = new S3();
      const bucketName = process.env.BUCKET_NAME!;

      const s3Contents = await s3
        .listObjectsV2({ Bucket: bucketName })
        .promise();

      const latestFile = s3Contents.Contents?.sort((a, b) => {
        if (a.LastModified! < b.LastModified!) {
          return -1;
        }
        if (a.LastModified! > b.LastModified!) {
          return 1;
        }
        return 0;
      })[0];

      const file = await s3
        .getObject({
          Bucket: bucketName,
          Key: latestFile?.Key!,
        })
        .promise();

      const profile = JSON.parse(file.Body?.toString()!);

      return profile;
    } catch (e) {
      console.error(e);
      return "error getting previous profile";
    }
  } else {
    // look in the current directory for the latest profile
    try {
      const files = fs.readdirSync("./");

      const fileNamePattern = /profile-\d+\.cpuprofile/;
      const latestCpuProfile = files
        .filter((file) => fileNamePattern.test(file))
        .sort((a, b) => {
          const neamWithoutPrefix = (fileName: string) =>
            fileName.replace("profile-", "");
          const nameWithoutSuffix = (fileName: string) =>
            fileName.replace(".cpuprofile", "");
          const dateA = parseInt(nameWithoutSuffix(neamWithoutPrefix(a)));
          const dateB = parseInt(nameWithoutSuffix(neamWithoutPrefix(b)));

          if (dateA < dateB) {
            return -1;
          }
          if (dateA > dateB) {
            return 1;
          }
          return 0;
        })[0];

      const latestFile = `./${latestCpuProfile}`;

      const file = fs.readFileSync(latestFile);
      const profile = JSON.parse(file.toString());

      return profile;
    } catch (e) {
      console.error(e);
      return "error getting previous profile";
    }
  }
}

const functionSliceDeltas = new Set();
let depth = 0;

function compareFlamegraphNodes(
  previous: FlameGraphNode,
  current: FlameGraphNode
): any {
  for (let i = 0; i < previous.children.length; i++) {
    const previousChild = previous.children[i];
    const currentChild = current.children[i];

    if (!previousChild || !currentChild) {
      continue;
    }

    const isSameName = previousChild.name === currentChild.name;
    const sliceId = `${previousChild.name}-${depth}`;

    if (isSameName) {
      // compare the execution time
      const executionTimeDelta =
        previousChild.executionTime - currentChild.executionTime;
      functionSliceDeltas.add({ sliceId, executionTimeDelta });
    }

    const childDiff: any = compareFlamegraphNodes(previousChild, currentChild);
  }

  depth++;

  return functionSliceDeltas;
}

function compareProfiles(
  previous: Protocol.Profiler.Profile,
  current: Protocol.Profiler.Profile
) {
  if (!previous) {
    console.log("no previous to compare");
    return "no previous to compare";
  }

  if (!current) {
    console.log("no current to compare");
    return "no current to compare";
  }

  // convert the profiles to flamegraphs
  const previousFlamegraph = convertToMergedFlameGraph(previous as Profile);
  const currentFlamegraph = convertToMergedFlameGraph(current as Profile);

  // compare each of the flamegraph nodes to see what changed
  const diff = compareFlamegraphNodes(previousFlamegraph, currentFlamegraph);

  return diff;
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
