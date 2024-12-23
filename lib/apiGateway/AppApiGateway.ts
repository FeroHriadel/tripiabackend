import * as cdk from 'aws-cdk-lib';
import { RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';



export class AppApiGateway {
  private stack: cdk.Stack;
  public api: RestApi;


  public constructor(stack: cdk.Stack) {
    this.stack = stack;
    this.initialize();
  }


  private initialize() {
    this.initApi();
    this.logEndpoint();
  }
  
  private initApi() {
    this.api = new RestApi(this.stack, `${this.stack.stackName}Api`, {
        defaultCorsPreflightOptions: {
           allowHeaders: [
                'Content-Type',
                'X-Amz-Date',
                'Authorization',
                'X-Api-Key'
           ],
           allowMethods: Cors.ALL_METHODS,
           allowCredentials: true,
           allowOrigins: Cors.ALL_ORIGINS
        }
    })
  }

  private logEndpoint() {
    new cdk.CfnOutput(this.stack, 'API ENDPOINT: ', {value: this.api.url});
  }
}