---
title: Introduction to VPC Endpoints
author: haimtran
publishedDate: 20/09/2022
date: 2022-09-20
---

## Introduction

[GitHub](https://github.com/cdk-entest/vpc-endpoints) shows basic concepts of vpc endpoints

- gateway endpoint s3 service
- interface endpoints for ssm ec2 connection
- interface endpooint to invoke lambda from vpc

<LinkedImage
  href="#"
  height={400}
  alt="VPC FlowLogs"
  src="/thumbnail/vpc-endpoints.png"
/>

## VPC Stack

create a vpc with public, private-nat-subnet, private-isolated-subnet,

```tsx
this.vpc = new aws_ec2.Vpc(this, "DemoVpc", {
  vpcName: "DemoVpc",
  cidr: props.cidr,
  maxAzs: 1,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  subnetConfiguration: [
    {
      name: "Public",
      cidrMask: 24,
      subnetType: aws_ec2.SubnetType.PUBLIC,
    },
    {
      name: "PrivateNat",
      cidrMask: 24,
      subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT,
    },
    {
      name: "Isolated",
      cidrMask: 24,
      subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
    },
  ],
});
this.vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);
```

## Add VPC Endpoints

add gateway endpoint s3

```tsx
this.vpc.addGatewayEndpoint("S3Endpoint", {
  service: aws_ec2.GatewayVpcEndpointAwsService.S3,
  // default all subnets
});
```

add interface endpoint for ssm ec2 connection

```tsx
// vpc service endpoints ssm ec2
this.vpc.addInterfaceEndpoint("SsmEndpoint", {
  service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
  privateDnsEnabled: true,
  subnets: {
    subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
  },
});

this.vpc.addInterfaceEndpoint("SsmMessage", {
  service: aws_ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
  privateDnsEnabled: true,
  subnets: {
    subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
  },
});

this.vpc.addInterfaceEndpoint("Ec2Message", {
  service: aws_ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
  privateDnsEnabled: true,
  subnets: {
    subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
  },
});
```

## Private EC2

launch an ec2 instance in the isolated subnet

```tsx
export class Ec2Stack extends Stack {
  constructor(scope: Construct, id: string, props: Ec2Props) {
    super(scope, id, props);

    new aws_ec2.Instance(this, "PrivateEc2", {
      instanceName: "PrivateEc2",
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
      instanceType: aws_ec2.InstanceType.of(
        aws_ec2.InstanceClass.T2,
        aws_ec2.InstanceSize.SMALL
      ),
      machineImage: new aws_ec2.AmazonLinuxImage({
        generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role: props.role,
      securityGroup: props.sg,
    });
  }
}
```

## Lambda VPC Endpoint
