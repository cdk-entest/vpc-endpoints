import { aws_ec2, aws_iam, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

interface Ec2Props extends StackProps {
  vpc: aws_ec2.Vpc;
  sg: aws_ec2.SecurityGroup;
  role: aws_iam.Role;
}

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
