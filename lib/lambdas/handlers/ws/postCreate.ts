import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { v4 } from 'uuid';
import { ResponseError } from '../ResponseError';
import { checkRequiredKeys, log, wsRes, sendToWSConnections } from '../utils';
import { getGroupConnections, savePost } from '../dbOperations';



const endpointWithHttps = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss', 'https'); //ApiGatewayManagementApiClien needs the ws enpoint to start with `https`, not `wss`
const apiGatewayClient = new ApiGatewayManagementApiClient({endpoint: endpointWithHttps});



interface CreatePostObjProps {
  postedBy: string; 
  groupId: string; 
  body: string; 
  images?: string[];
}



function createPostObj(props: CreatePostObjProps) {
  const { postedBy, groupId, body, images } = props;
  const post = {
    id: v4(),
    groupId,
    createdAt: new Date().toISOString(),
    postedBy,
    body,
    images: images ? images : [],
    type: '#POST' as const
  };
  return post;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  try {
    if (!connectionId) throw new ResponseError(400, 'Failed to get connectionId');
    log('connectionId: ', connectionId);
    
    //get body
    const body = JSON.parse(event.body || '{}');
    log('body: ', body);

    //get all connected group members
    checkRequiredKeys(['postedBy', 'groupId', 'body'], body.post);
    const connectionsIds = await getGroupConnections(body.post.groupId);
    log('connectionsIds: ', connectionsIds);
    
    //save post
    const post = createPostObj(body.post);
    const saveRes = await savePost({post: post, table: 'secondary'});
    log('saveRes: ', saveRes);

    //send post to all connected group members
    const message = {action: 'postCreate', post};
    await Promise.all(sendToWSConnections({connectionsIds, apiGatewayClient, message}));

    //FE doesn't get this but chatGPT says this is mandatory. So I keep this line just in case
    return wsRes(201, message);
    
  } catch (error) {
    log('error: ', error);
    const message = {action: 'postCreate', error: 'Failed to create post'};
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
}

