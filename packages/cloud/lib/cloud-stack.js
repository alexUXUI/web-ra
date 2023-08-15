"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const s3assets = require("aws-cdk-lib/aws-s3-assets");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");
class CloudStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.CloudStack = CloudStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbG91ZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELDJDQUEyQztBQUMzQyxzREFBc0Q7QUFDdEQseURBQXlEO0FBRXpELDZCQUE2QjtBQUU3QixNQUFhLFVBQVcsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3pELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztTQUM1RCxDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBRXZFLE1BQU0sV0FBVyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQzFELElBQUksRUFBRSxlQUFlO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztTQUMzQixDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUVqRCxNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMzRCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxXQUFXLENBQUM7WUFDekUsSUFBSSxFQUFFLGVBQWU7WUFDckIsVUFBVSxFQUFFLElBQUk7WUFDaEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUNsQyxDQUFDLENBQUM7UUFFSCxNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqRSxPQUFPLEVBQUUsY0FBYztZQUN2QixLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9CRCxnQ0ErQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0ICogYXMgczNhc3NldHMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zMy1hc3NldHNcIjtcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCI7XG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGNsYXNzIENsb3VkU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBSYUlhbUxhbWJkYVJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgXCJSYUxhbWJkYVJvbGVcIiwge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJsYW1iZGEuYW1hem9uYXdzLmNvbVwiKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJ1bnRpbWVDb2RlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vLi4vYXBwL2Rpc3QvYXBwLnppcFwiKTtcblxuICAgIGNvbnN0IHJ1bnRpbWVDb2RlID0gbmV3IHMzYXNzZXRzLkFzc2V0KHRoaXMsIFwiUmFDb2RlQXNzZXRcIiwge1xuICAgICAgcGF0aDogcnVudGltZUNvZGVQYXRoLFxuICAgICAgcmVhZGVyczogW1JhSWFtTGFtYmRhUm9sZV0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBidWNrZXROYW1lID0gcnVudGltZUNvZGUuYnVja2V0LmJ1Y2tldE5hbWU7XG5cbiAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJSYUxhbWJkYVwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGhhbmRsZXI6IFwiaW5kZXguaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUJ1Y2tldChydW50aW1lQ29kZS5idWNrZXQsIHJ1bnRpbWVDb2RlLnMzT2JqZWN0S2V5KSxcbiAgICAgIHJvbGU6IFJhSWFtTGFtYmRhUm9sZSxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGlHYXRld2F5ID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCBcIlJhUmVzdEFwaVwiLCB7XG4gICAgICBoYW5kbGVyOiBsYW1iZGFGdW5jdGlvbixcbiAgICAgIHByb3h5OiB0cnVlLFxuICAgIH0pO1xuICB9XG59XG4iXX0=