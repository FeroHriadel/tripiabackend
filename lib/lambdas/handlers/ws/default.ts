import { ResponseError } from '../ResponseError';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { log, sendToWSConnections } from '../utils';



const endpointWithHttps = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss', 'https'); // ApiGatewayManagementApiClient needs the ws endpoint to start with `https`, not `wss`
const apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint: endpointWithHttps });



export const handler = async (event: any) => {
  try {
    const connectionId = event.requestContext.connectionId; log('connectionId: ', connectionId);
    const message = { action: 'Pong', body: 'Pong' };
    await Promise.all(sendToWSConnections({ connectionsIds: [connectionId], apiGatewayClient, message }));
    return { statusCode: 200, body: 'Pong' };
  } catch (error) {
    if (error instanceof Error || error instanceof ResponseError) {
      return {statusCode: (error as ResponseError).statusCode || 500, error: error.message || 'Something went wrong'}      
    }
    else return {statusCode: 500, error: 'Something went wrong'};
  }
};
