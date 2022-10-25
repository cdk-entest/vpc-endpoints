#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RdsLambdaStack } from "../lib/lambda-rds-vpc-stack";

const app = new cdk.App();

// lambda and rds postgres
new RdsLambdaStack(app, "RdsLambdaStack", {
  functionName: "LambdaAccessRdsVpc",
  vpcId: "vpc-07cafc6a819930727",
  vpcName: "MyNetworkStack/VpcWithS3Endpoint",
  dbName: "RdsInstaceDemo",
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
