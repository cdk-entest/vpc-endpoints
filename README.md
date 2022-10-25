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

## Lambda RDS in VPC 
- create a RDS in private subnest 
- add vpc endpoints so lambda can access rds and secrete manager
- check lambda and rds security group
- test lambda fetch data from rds tables 


get the existed vpc 
```tsx 
const vpc = aws_ec2.Vpc.fromLookup(this, "Vpc", {
  vpcId: props.vpcId,
  vpcName: props.vpcName,
});
```

add vpc endpoint to access secrete manager

```tsx
vpc.addInterfaceEndpoint("SecreteManagerVpcEndpoint", {
  service:
    aws_ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  privateDnsEnabled: true,
  subnets: {
    subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
  },
});
```

db credentials by secret manager 
```tsx 
const credentials = aws_rds.Credentials.fromGeneratedSecret(
  "mysqlSecret",
  {
    secretName: "mysql-secret-name",
  }
);
```


aws rds db instance in private subnets
```tsx
const rds = new aws_rds.DatabaseInstance(
      this,
      "RdsIntance",
      {
        // production => RETAIN
        removalPolicy: RemovalPolicy.DESTROY,
        databaseName: props.dbName,
        // make sure combination version and instance type
        engine: aws_rds.DatabaseInstanceEngine.mysql({
          version: aws_rds.MysqlEngineVersion.VER_8_0_28,
        }),
        instanceType: aws_ec2.InstanceType.of(
          aws_ec2.InstanceClass.BURSTABLE3,
          aws_ec2.InstanceSize.SMALL
        ),
        vpc,
        vpcSubnets: {
          // production => private subnet
          subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
        credentials: credentials,
        securityGroups: [securityGroup]
      }
    );
```


## Lambda Stack 
role for lambda 
```tsx
const role = new aws_iam.Role(this, "RoleForLambdaRdsVpc", {
      roleName: "RoleForLambdaAccessRdsVpc",
      assumedBy: new aws_iam.ServicePrincipal(
        "lambda.amazonaws.com"
      ),
    });

role.attachInlinePolicy(
      new aws_iam.Policy(this, "PolicyForLambdaAccessRdsVpc", {
        policyName: "PolicyForLambdaAccessRdsVpc",
        statements: [
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ["rds:*"],
            resources: ["*"],
          }),
        ],
      })
    );

role.addManagedPolicy(
  aws_iam.ManagedPolicy.fromManagedPolicyArn(
    this,
    "AWSLambdaVPCAccessExecutionRole",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
  )
);

role.addManagedPolicy(
  aws_iam.ManagedPolicy.fromManagedPolicyArn(
    this,
    "LambdaSecretManager",
    "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
  )
);
```

lambda function in vpc 
```tsx
new aws_lambda.Function(this, "LambdaRdsVpc", {
      functionName: props.functionName,
      runtime: aws_lambda.Runtime.PYTHON_3_8,
      code: aws_lambda.Code.fromAsset(
        path.join(__dirname, "lambda/package.zip")
      ),
      handler: "index.handler",
      timeout: Duration.seconds(10),
      memorySize: 512,
      role,
      vpc,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        SECRET_ARN:
          (credentials.secret &&
            credentials.secret?.secretArn.toString()) ||
          "",
      },
    });
```

stack output 
```tsx
new CfnOutput(this, "SECRET_ARN", {
      value:
        (credentials.secret && credentials.secret?.secretArn) ||
        "",
    });
```

## Troubleshooting 
run create_table.py to test 
- get rds credentials from secrete manager 
- rds connector, lambda and rds subnets and security group 
- create IcaDb database 
- create employee table in IcaDb database
- fetch data from employee table
