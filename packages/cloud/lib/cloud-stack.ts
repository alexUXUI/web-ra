import { Construct } from "constructs";

import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

import * as path from "path";

export class CloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const RaIamLambdaRole = new iam.Role(this, "RaLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const runtimeCodePath = path.join(__dirname, "../../app/dist/app.zip");

    const runtimeCode = new s3assets.Asset(this, "RaCodeAsset", {
      path: runtimeCodePath,
      readers: [RaIamLambdaRole],
    });

    const bucketName = runtimeCode.bucket.bucketName;

    const lambdaFunction = new lambda.Function(this, "RaLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromBucket(runtimeCode.bucket, runtimeCode.s3ObjectKey),
      role: RaIamLambdaRole,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
    });

    const apiGateway = new apigateway.LambdaRestApi(this, "RaRestApi", {
      handler: lambdaFunction,
      proxy: true,
    });
  }
}
