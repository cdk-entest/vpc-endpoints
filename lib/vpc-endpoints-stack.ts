import {
  aws_ec2,
  aws_iam,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface NetworkProps extends StackProps {
  cidr: string;
}
export class NetworkStack extends Stack {
  public readonly vpc: aws_ec2.Vpc;
  public readonly rolePrivateEc2: aws_iam.Role;
  public readonly sgPrivateEc2: aws_ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id, props);

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

    // vpc gateway endpoint s3
    this.vpc.addGatewayEndpoint("S3Endpoint", {
      service: aws_ec2.GatewayVpcEndpointAwsService.S3,
      // default all subnets
    });

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

    // security group for private ec2
    this.sgPrivateEc2 = new aws_ec2.SecurityGroup(
      this,
      "SecurityGroupForPrivateEc2",
      {
        securityGroupName: "SecurityGroupForPrivateEc2",
        vpc: this.vpc,
      }
    );

    this.sgPrivateEc2.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(443)
    );

    // role for private ec2
    this.rolePrivateEc2 = new aws_iam.Role(this, "RoleForEc2Private", {
      roleName: "RoleForEc2PrivateVpcEndpointDemom",
      assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    this.rolePrivateEc2.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["s3:*"],
      })
    );
  }
}
