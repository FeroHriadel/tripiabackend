import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { MethodOptions, RestApi, Cors, LambdaIntegration, Resource, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { AppLambdas } from '../../types';
import { createLambdaIntegration, createLambdaIntegrations, createResource, addFunctionToResource } from './utils';



interface AttachLambdasToApiProps {
  api: RestApi;
  lambdas: AppLambdas;
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddCategoryEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
};

interface AddTripEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddBucketsEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddUserEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}



//CATEGORIES
function addCategoryEndpoints(props: AddCategoryEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'categories', api});
  const pathParamsResource = resource.addResource('{id}');
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations[`categoryCreate`], method: 'POST', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['categoryGet'], method: 'GET'});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryDelete'], method: 'DELETE', authorizer});
}

//TRIPS
function addTripEndpoints(props: AddTripEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'trips', api});
  const pathParamsResource = resource.addResource('{id}');
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations[`tripCreate`], method: 'POST', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations[`tripGet`], method: 'GET'});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['tripUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['tripDelete'], method: 'DELETE', authorizer});
}

//BUCKETS
function addBucketsEndpoints(props: AddBucketsEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const getImageUploadLinkResource = createResource({pathName: 'imageuploadlink', api});
  addFunctionToResource({resource: getImageUploadLinkResource, lambdaIntegration: lambdaIntegrations['getImageUploadLink'], method: 'POST'}); //!add authorizer!
}

//USERS
function addUsersEndpoints(props: AddTripEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'users', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['userUpdate'], method: 'PUT', authorizer});
}

//MAIN FUNCTION CALLS ALL FUNCTIONS ABOVE
export function attachLambdasToApi(props: AttachLambdasToApiProps) {
  const { api, lambdas, authorizer } = props;
  const lambdaIntegrations = createLambdaIntegrations(lambdas);
  addCategoryEndpoints({api, lambdaIntegrations, authorizer});
  addTripEndpoints({api, lambdaIntegrations, authorizer});
  addBucketsEndpoints({api, lambdaIntegrations, authorizer});
  addUsersEndpoints({api, lambdaIntegrations, authorizer});
}