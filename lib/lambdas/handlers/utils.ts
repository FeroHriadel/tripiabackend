import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseError } from "./ResponseError";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';



export function log(item1: any, item2?: any) {
  if (!item2) console.log(item1);
  else console.log(item1, item2);
}

export function res(statusCode: number, body: {[key: string]: any} | any[]) {
  const response: APIGatewayProxyResult = {
      statusCode: statusCode || 500,
      headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': '*'},
      body: JSON.stringify(body) || JSON.stringify({error: 'No operation ran'})
  };
  log('Responding: ', response);
  return response;
}

export function wsRes(statusCode: number, body: any) {
  const response: APIGatewayProxyResult = {
      statusCode: statusCode || 500,
      body: JSON.stringify(body)
  };
  log('Responding: ', response);
  return response;
}

export function sendToWSConnections(props: {apiGatewayClient: ApiGatewayManagementApiClient, connectionsIds: string[], message: any}) {
  const {connectionsIds, apiGatewayClient, message } = props;
  const postToConnections = connectionsIds.map(async (connectionId) => {
    try {
      await apiGatewayClient.send(new PostToConnectionCommand({ConnectionId: connectionId, Data: JSON.stringify(message)}));
    } catch (err) {
      log(`Failed to send message to connection ${connectionId}:`, err);
    }
  });
  return postToConnections;
}

export function checkRequiredKeys(requiredKeys: string[], objectToCheck: {[key: string]: any}) {
  requiredKeys.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(objectToCheck, key)) {
      throw new ResponseError(400, `${key} is required`);
    }
  });
}

export function isAdmin(event: APIGatewayProxyEvent) {
  const isAdmin = event?.requestContext?.authorizer?.claims['cognito:groups'] === 'admin';
  return isAdmin;
}

export function getUserEmail(event: APIGatewayProxyEvent) {
  const userEmail = event?.requestContext?.authorizer?.claims['email'];
  return userEmail;
}

export function adminOnly(event: APIGatewayProxyEvent) {
  const isUserAdmin = isAdmin(event);
  if (!isUserAdmin) throw new ResponseError(403, 'Admin access required');
}

export function getLastEvaluatedKeyFromUri(event: APIGatewayProxyEvent) {
  const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey 
  ? 
  JSON.parse(decodeURIComponent(event.queryStringParameters.lastEvaluatedKey))
  : 
  undefined;
  return lastEvaluatedKey;
}

export function getEncodedStringFromUri(props: { event: APIGatewayProxyEvent, queryStringKey: string }): string | undefined {
  const { event, queryStringKey } = props;
  const queryStringValue = event.queryStringParameters?.[queryStringKey] 
    ? decodeURIComponent(event.queryStringParameters[queryStringKey]) 
    : undefined;
  return queryStringValue;
}

export function getImageKey(url: string) {
  const key = url.split('.com/')[1];
  return key;
}

export function structureImagesToDeleteForEventBus(imagesArr: string[]) {
  const images: {[key: string]: any} = {};
  imagesArr.forEach((image, index) => {
      images[`image${index + 1}`] = getImageKey(image);
  });
  log('Images to delete: ', images);
  return images; // {image1: '2024-06VFPrasnica.jpg65817.png', image2: '2024-06VFPrasnica2.jpg47097.png', ...}
}

export function getWsUserEmail(event: APIGatewayProxyEvent): string | null {
  const authorizer = event.requestContext.authorizer;
  if (authorizer && authorizer.data) {
    try {
      const decodedToken = JSON.parse(authorizer.data);
      return decodedToken?.decodedToken?.email || null;
    } catch (error) {
      console.error("Error parsing authorizer data:", error);
      return null;
    }
  }
  return null;
}

export function isUserAdminWs(event: APIGatewayProxyEvent): boolean {
  const authorizer = event.requestContext.authorizer;
  if (authorizer && authorizer.data) {
    try {
      const decodedToken = JSON.parse(authorizer.data);
      const groups = decodedToken?.decodedToken?.["cognito:groups"] || [];
      return groups.includes("admin");
    } catch (error) {
      console.error("Error parsing authorizer data:", error);
      return false;
    }
  }
  return false;
}
