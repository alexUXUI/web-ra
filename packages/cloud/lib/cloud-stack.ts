import { Construct } from "constructs";

import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3assets from "aws-cdk-lib/aws-s3-assets";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import {
  Bucket,
  BucketAccessControl,
  BlockPublicAccess,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";

import * as path from "path";

export class CloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "ra-results", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
    });

    bucket.grantPublicAccess("*");

    const RaIamLambdaRole = new iam.Role(this, "RaLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const runtimeCodePath = path.join(__dirname, "../../app/dist/app.zip");

    const runtimeCode = new s3assets.Asset(this, "RaCodeAsset", {
      path: runtimeCodePath,
      readers: [RaIamLambdaRole],
    });

    const lambdaFunction = new lambda.Function(this, "RaLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromBucket(runtimeCode.bucket, runtimeCode.s3ObjectKey),
      role: RaIamLambdaRole,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(lambdaFunction);

    // make the bucket objects public
    bucket.grantPublicAccess("*");

    const apiGateway = new apigateway.LambdaRestApi(this, "RaRestApi", {
      handler: lambdaFunction,
      proxy: true,
    });
  }
}
