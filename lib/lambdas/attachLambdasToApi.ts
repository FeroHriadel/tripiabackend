import { RestApi, LambdaIntegration, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { AppLambdas } from '../../types';
import { createLambdaIntegrations, createResource, addFunctionToResource } from './utils';



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

interface AddUsersEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddCommentsEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddGroupsEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}

interface AddInvitationsEndpointsProps {
  api: RestApi;
  lambdaIntegrations: {[key: string]: LambdaIntegration};
  authorizer: CognitoUserPoolsAuthorizer;
}



//CATEGORIES ENDPOINTS
function addCategoryEndpoints(props: AddCategoryEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'categories', api});
  const pathParamsResource = resource.addResource('{id}');
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations[`categoryCreate`], method: 'POST', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['categoryGet'], method: 'GET'});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['categoryDelete'], method: 'DELETE', authorizer});
}

//TRIPS ENDPOINTS
function addTripEndpoints(props: AddTripEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const tripsResource = createResource({pathName: 'trips', api});
  const tripsBatchResource = tripsResource.addResource('batch');
  const pathParamsResource = tripsResource.addResource('{id}');
  addFunctionToResource({resource: tripsResource, lambdaIntegration: lambdaIntegrations[`tripCreate`], method: 'POST', authorizer});
  addFunctionToResource({resource: tripsResource, lambdaIntegration: lambdaIntegrations[`tripGet`], method: 'GET'});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['tripUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['tripDelete'], method: 'DELETE', authorizer});
  addFunctionToResource({resource: tripsBatchResource, lambdaIntegration: lambdaIntegrations['tripBatchGet'], method: 'POST'});
}

//IMAGES ENDPOINTS
function addImagesEndpoints(props: AddBucketsEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const getImageUploadLinkResource = createResource({pathName: 'imageuploadlink', api});
  addFunctionToResource({resource: getImageUploadLinkResource, lambdaIntegration: lambdaIntegrations['getImageUploadLink'], method: 'POST', authorizer});
}

//USERS ENDPOINTS
function addUsersEndpoints(props: AddUsersEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'users', api});
  const batchGetResource = createResource({pathName: 'usersbatchget', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['userGet'], method: 'POST'}); //must be POST bc GET doesn't support req.body
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['userUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: batchGetResource, lambdaIntegration: lambdaIntegrations['userBatchGet'], method: 'POST'}); //must be POST bc GET doesn't support req.body
}

//FAVORITE TRIPS ENDPOINTS
function addFavoriteTripsEndpoints(props: AddUsersEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'favoritetrips', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['favoriteTripsGet'], method: 'GET', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['favoriteTripsSet'], method: 'POST', authorizer});
}

//COMMENTS ENDPOINTS
function addCommentsEndpoints(props: AddCommentsEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'comments', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['commentCreate'], method: 'POST', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['commentGet'], method: 'GET'});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['commentDelete'], method: 'DELETE', authorizer});
}

//GROUPS ENDPOINTS
function addGroupsEndpoints(props: AddGroupsEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'groups', api});
  const pathParamsResource = resource.addResource('{id}');
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['groupCreate'], method: 'POST', authorizer});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['groupGet'], method: 'GET', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['groupUpdate'], method: 'PUT', authorizer});
  addFunctionToResource({resource: pathParamsResource, lambdaIntegration: lambdaIntegrations['groupDelete'], method: 'DELETE', authorizer});
}

//INVITATIONS ENDPOINTS
function addInvitationsEndpoints(props: AddInvitationsEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'invitations', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['invitationCreate'], method: 'POST', authorizer});
}

//MAIN FUNCTION: CALLS ALL FUNCTIONS ABOVE
export function attachLambdasToApi(props: AttachLambdasToApiProps) {
  const { api, lambdas, authorizer } = props;
  const lambdaIntegrations = createLambdaIntegrations(lambdas);
  addCategoryEndpoints({api, lambdaIntegrations, authorizer});
  addImagesEndpoints({api, lambdaIntegrations, authorizer});
  addTripEndpoints({api, lambdaIntegrations, authorizer});
  addUsersEndpoints({api, lambdaIntegrations, authorizer});
  addFavoriteTripsEndpoints({api, lambdaIntegrations, authorizer});
  addCommentsEndpoints({api, lambdaIntegrations, authorizer});
  addGroupsEndpoints({api, lambdaIntegrations, authorizer});
  addInvitationsEndpoints({api, lambdaIntegrations, authorizer});
}