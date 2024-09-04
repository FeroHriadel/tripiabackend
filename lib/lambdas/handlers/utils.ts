import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseError } from "./ResponseError";



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