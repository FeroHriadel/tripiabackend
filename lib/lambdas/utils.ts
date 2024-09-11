import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { MethodOptions, RestApi, LambdaIntegration, Resource, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { AppLambdas } from '../../types';



type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';



export function createLambdaIntegration(lambda: NodejsFunction) { return new LambdaIntegration(lambda) }; //wraps lambda in a wrapper that can be attached to api

export function createLambdaIntegrations(lambdas: AppLambdas) {
  const lambdaIntegrations: {[key: string]: LambdaIntegration} = {};
  //@ts-ignore
  Object.keys(lambdas).forEach((key) => { lambdaIntegrations[`${key}`] = createLambdaIntegration(lambdas[`${key}`]); });
  return lambdaIntegrations;
}

export function createResource(props: {pathName: string, api: RestApi}) { //resource = api endpoint
  const { pathName, api } = props;
  const resource = api.root.addResource(pathName);
  return resource;
}

export function addFunctionToResource(props: {resource: Resource, lambdaIntegration: LambdaIntegration, method: ApiMethod, authorizer?: CognitoUserPoolsAuthorizer}) {
  const { resource, lambdaIntegration, method, authorizer } = props;
  if (authorizer) {
    const options: MethodOptions = {authorizationType: AuthorizationType.COGNITO, authorizer: {authorizerId: authorizer.authorizerId}};
    resource.addMethod(method, lambdaIntegration, options);
  } else {
    resource.addMethod(method, lambdaIntegration);
  }
}