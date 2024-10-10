import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { WsLambdas } from '../../types';
import * as iam from 'aws-cdk-lib/aws-iam';



/*****************************************************************************************************
  - At the time of creation of wsLambdas there's no WEBSOCKET_API_ENDPOINT env. var and no policy
  - Feel free to use the WEBSOCKET_API_ENDPOINT in their handlers though => it will be added here
  - WS related Policies will be added here as well
******************************************************************************************************/



interface Props {
  wsLambdas: WsLambdas;
}



export class AppWsGateway {
  private stack: cdk.Stack;
  public wsApi: apigatewayv2.WebSocketApi;
  private wsStage: apigatewayv2.WebSocketStage;
  public wsEndpoint: string;
  private wsLambdas: WsLambdas;


  public constructor(stack: cdk.Stack, props: Props) {
    this.stack = stack;
    this.wsLambdas = props.wsLambdas;
    this.initialize();
  }


  private initialize() {
    this.createWsApi();
    this.deployWsApi();
    this.getWsEndpoint();
    this.logWsEndpoint();
    this.addWsEndpointToEnvVars();
    this.addManageConnectionsRole();
    this.addCustomRoutes();
    this.wsApi
  }

  private createWsApi() {
    this.wsApi = new apigatewayv2.WebSocketApi(this.stack, `${this.stack.stackName}WsApi`, { 
      apiName: `${this.stack.stackName}WsApi`,
      connectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration(
          `${this.stack.stackName}ConnectIntegration`, 
          this.wsLambdas.connectLambda!
        )
      },
      disconnectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration(
          `${this.stack.stackName}DisconnectIntegration`,
          this.wsLambdas.disconnectLambda!
        )
      },
      defaultRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration(
          `${this.stack.stackName}DefaultIntegration`,
          this.wsLambdas.defaultLambda!
        )
      }
    });
  }

  private deployWsApi() {
    this.wsStage = new apigatewayv2.WebSocketStage(this.stack, `${this.stack.stackName}WsStage`, {
      webSocketApi: this.wsApi,
      stageName: 'prod',
      autoDeploy: true
    });
  }

  public getWsEndpoint() {
    this.wsEndpoint = this.wsApi.apiEndpoint + '/' + this.wsStage.stageName;
  }

  private logWsEndpoint() {
    new cdk.CfnOutput(this.stack, 'WS ENDPOINT: ', {value: this.wsEndpoint});
  }

  private addWsEndpointToEnvVars() {
    const excludedKeys: (keyof WsLambdas)[] = ['connectLambda', 'disconnectLambda', 'defaultLambda'];
    (Object.keys(this.wsLambdas) as Array<keyof WsLambdas>).forEach((key) => {
       if (excludedKeys.includes(key)) return;
      const lambda = this.wsLambdas[key];
      lambda!.addEnvironment('WEBSOCKET_API_ENDPOINT', this.wsEndpoint);
    });
  }

  private addManageConnectionsRole() {
    //create policy
    const manageConnectionsPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.stack.region}:${this.stack.account}:${this.wsApi.apiId}/*`],
    });
    //these lambdas don't need the policy
    const excludedKeys: (keyof WsLambdas)[] = ['connectLambda', 'disconnectLambda', 'defaultLambda'];
    //give the policy to all other lambdas
    (Object.keys(this.wsLambdas) as Array<keyof WsLambdas>).forEach((key) => {
      if (excludedKeys.includes(key)) return;
      this.wsLambdas[key]!.addToRolePolicy(manageConnectionsPolicy);
    });
  }

  private addCustomRoutes() {
    const excludedKeys: (keyof WsLambdas)[] = ['connectLambda', 'disconnectLambda', 'defaultLambda'];
    (Object.keys(this.wsLambdas) as Array<keyof WsLambdas>).forEach((key) => {
      if (excludedKeys.includes(key)) return;
      const lambda = this.wsLambdas[key];
      this.wsApi.addRoute(key, {integration: new integrations.WebSocketLambdaIntegration(`${this.stack.stackName}${key}Integration`, lambda!)});
    });
  }
}