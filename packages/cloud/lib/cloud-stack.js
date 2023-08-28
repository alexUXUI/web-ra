"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const s3assets = require("aws-cdk-lib/aws-s3-assets");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const path = require("path");
class CloudStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const bucket = new aws_s3_1.Bucket(this, "ra-results", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: aws_s3_1.BlockPublicAccess.BLOCK_ACLS,
            accessControl: aws_s3_1.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            objectOwnership: aws_s3_1.ObjectOwnership.OBJECT_WRITER,
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
exports.CloudStack = CloudStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbG91ZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELDJDQUEyQztBQUMzQyxzREFBc0Q7QUFDdEQseURBQXlEO0FBQ3pELCtDQUs0QjtBQUU1Qiw2QkFBNkI7QUFFN0IsTUFBYSxVQUFXLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzVDLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsMEJBQWlCLENBQUMsVUFBVTtZQUMvQyxhQUFhLEVBQUUsNEJBQW1CLENBQUMseUJBQXlCO1lBQzVELGVBQWUsRUFBRSx3QkFBZSxDQUFDLGFBQWE7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTlCLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3pELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztTQUM1RCxDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBRXZFLE1BQU0sV0FBVyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzFELElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztTQUMzQixDQUFDLENBQUM7UUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMzRCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxXQUFXLENBQUM7WUFDekUsSUFBSSxFQUFFLGVBQWU7WUFDckIsVUFBVSxFQUFFLElBQUk7WUFDaEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNsQyxXQUFXLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVO2FBQy9CO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV0QyxpQ0FBaUM7UUFDakMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTlCLE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ2pFLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOUNELGdDQThDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5cbmltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XG5pbXBvcnQgKiBhcyBzM2Fzc2V0cyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzLWFzc2V0c1wiO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCB7XG4gIEJ1Y2tldCxcbiAgQnVja2V0QWNjZXNzQ29udHJvbCxcbiAgQmxvY2tQdWJsaWNBY2Nlc3MsXG4gIE9iamVjdE93bmVyc2hpcCxcbn0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBDbG91ZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCBcInJhLXJlc3VsdHNcIiwge1xuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBCbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BQ0xTLFxuICAgICAgYWNjZXNzQ29udHJvbDogQnVja2V0QWNjZXNzQ29udHJvbC5CVUNLRVRfT1dORVJfRlVMTF9DT05UUk9MLFxuICAgICAgb2JqZWN0T3duZXJzaGlwOiBPYmplY3RPd25lcnNoaXAuT0JKRUNUX1dSSVRFUixcbiAgICB9KTtcblxuICAgIGJ1Y2tldC5ncmFudFB1YmxpY0FjY2VzcyhcIipcIik7XG5cbiAgICBjb25zdCBSYUlhbUxhbWJkYVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgXCJSYUxhbWJkYVJvbGVcIiwge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJsYW1iZGEuYW1hem9uYXdzLmNvbVwiKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJ1bnRpbWVDb2RlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vLi4vYXBwL2Rpc3QvYXBwLnppcFwiKTtcblxuICAgIGNvbnN0IHJ1bnRpbWVDb2RlID0gbmV3IHMzYXNzZXRzLkFzc2V0KHRoaXMsIFwiUmFDb2RlQXNzZXRcIiwge1xuICAgICAgcGF0aDogcnVudGltZUNvZGVQYXRoLFxuICAgICAgcmVhZGVyczogW1JhSWFtTGFtYmRhUm9sZV0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJSYUxhbWJkYVwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6IFwiaW5kZXguaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUJ1Y2tldChydW50aW1lQ29kZS5idWNrZXQsIHJ1bnRpbWVDb2RlLnMzT2JqZWN0S2V5KSxcbiAgICAgIHJvbGU6IFJhSWFtTGFtYmRhUm9sZSxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg5MDApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQlVDS0VUX05BTUU6IGJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGJ1Y2tldC5ncmFudFJlYWRXcml0ZShsYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvLyBtYWtlIHRoZSBidWNrZXQgb2JqZWN0cyBwdWJsaWNcbiAgICBidWNrZXQuZ3JhbnRQdWJsaWNBY2Nlc3MoXCIqXCIpO1xuXG4gICAgY29uc3QgYXBpR2F0ZXdheSA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGkodGhpcywgXCJSYVJlc3RBcGlcIiwge1xuICAgICAgaGFuZGxlcjogbGFtYmRhRnVuY3Rpb24sXG4gICAgICBwcm94eTogdHJ1ZSxcbiAgICB9KTtcbiAgfVxufVxuIl19