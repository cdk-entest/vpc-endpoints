#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Ec2Stack } from "../lib/ec2-stack";
import { NetworkStack } from "../lib/vpc-endpoints-stack";

const app = new cdk.App();

// vpc network stack
const network = new NetworkStack(app, "NetworkStack", {
  cidr: "172.16.0.0/20",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-west-2",
  },
});

// private ec2
new Ec2Stack(app, "PrivateEc2Stack", {
  vpc: network.vpc,
  role: network.rolePrivateEc2,
  sg: network.sgPrivateEc2,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-west-2",
  },
});
