import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { MethodOptions, RestApi, Cors, LambdaIntegration, Resource, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { AppLambdas } from '../../types';



type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface AttachLambdasToApiProps {
  api: RestApi;
  lambdas: AppLambdas;
  authorizer?: CognitoUserPoolsAuthorizer;
}

interface AddCategoryEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer?: CognitoUserPoolsAuthorizer;
};



//HELPERS:
function createLambdaIntegration(lambda: NodejsFunction) { return new LambdaIntegration(lambda) }; //wraps lambda in a wrapper that can be attached to api

function createLambdaIntegrations(lambdas: AppLambdas) {
  const lambdaIntegrations: {[key: string]: LambdaIntegration} = {};
  Object.keys(lambdas).forEach((key) => {
    //@ts-ignore
    lambdaIntegrations[`${key}`] = createLambdaIntegration(lambdas[`${key}`]); 
  });
  return lambdaIntegrations;
}

function createResource(props: {pathName: string, api: RestApi}) { //resource = api endpoint
  const { pathName, api } = props;
  const resource = api.root.addResource(pathName);
  return resource;
}

function addFunctionToResource(props: {resource: Resource, lambdaIntegration: LambdaIntegration, method: ApiMethod, authorizer?: CognitoUserPoolsAuthorizer}) {
  const { resource, lambdaIntegration, method, authorizer } = props;
  if (authorizer) {
    const options: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {authorizerId: authorizer.authorizerId},
    };
    resource.addMethod(method, lambdaIntegration, options);
  }
  else resource.addMethod(method, lambdaIntegration);
}



//CATEGORIES
function addCategoryEndpoints(props: AddCategoryEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'categories', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations[`categoryCreate`], method: 'POST'});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['categoryGet'], method: 'GET'});
  const pathParamsResource = resource.addResource('{id}');
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryUpdate'], method: 'PUT'});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryDelete'], method: 'DELETE', authorizer});
}



//MAIN FUNCTION
export function attachLambdasToApi(props: AttachLambdasToApiProps) {
  const { api, lambdas, authorizer } = props;
  const lambdaIntegrations = createLambdaIntegrations(lambdas);
  addCategoryEndpoints({api, lambdaIntegrations, authorizer});
}