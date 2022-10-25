import {
  Stack,
  StackProps,
  aws_lambda,
  Duration,
  aws_ec2,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

interface LambdaVpcProps extends StackProps {
  vpc: aws_ec2.Vpc;
}

export class LambdaVpc extends Stack {
  constructor(scope: Construct, id: string, props: LambdaVpcProps) {
    super(scope, id, props);

    new aws_lambda.Function(this, "VpcLambda", {
      functionName: "VpcLambda",
      code: aws_lambda.Code.fromAsset(""),
      runtime: aws_lambda.Runtime.PYTHON_3_7,
      handler: "index.handler",
      memorySize: 512,
      timeout: Duration.seconds(10),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
      securityGroups: [],
    });
  }
}
