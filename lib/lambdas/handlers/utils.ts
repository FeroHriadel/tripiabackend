import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";



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