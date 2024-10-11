import { ResponseError } from '../ResponseError';
import { getPostsByGroupId } from '../dbOperations';
import { wsRes, log, checkRequiredKeys, sendToWSConnections } from '../utils';
import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';



const endpointWithHttps = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss', 'https'); //ApiGatewayManagementApiClien needs the ws enpoint to start with `https`, not `wss`
const apiGatewayClient = new ApiGatewayManagementApiClient({endpoint: endpointWithHttps});



export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  try {
    if (!connectionId) throw new ResponseError(400, 'Failed to get connectionId');

    //get body
    const body = JSON.parse(event.body || '{}');
    checkRequiredKeys(['groupId'], body);

    //get posts
    const posts = await getPostsByGroupId({groupId: body.groupId, table: 'primary'});

    //send posts to FE
    const message = {action: 'posts', posts};
    await Promise.all(sendToWSConnections({connectionsIds: [connectionId], apiGatewayClient, message}));

    //FE doesn't get this but chatGPT says this is mandatory. So I keep this line just in case
    return wsRes(200, {action: 'posts', posts});
    
  } catch (error) {
    log('error: ', error);
    const message = {action: 'posts', posts: [], error: 'Failed to get posts'};
    if (connectionId) await Promise.all(sendToWSConnections({connectionsIds: [connectionId], apiGatewayClient, message}));
    if (error instanceof Error || error instanceof ResponseError) {
      return wsRes(
        (error as ResponseError).statusCode || 500,
        {error: error.message || 'Something went wrong'}
      )   
    }
    else return wsRes(
      500,
      {error: (error as any).message || 'Something went wrong'}
    )
  }
};