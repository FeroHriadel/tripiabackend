import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { v4 } from 'uuid';
import { ResponseError } from '../ResponseError';
import { checkRequiredKeys, log, wsRes, sendToMultipleConnections } from '../utils';
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
  try {
    //get body
    log('lambda triggered...');
    log('event: ', event);
    const body = JSON.parse(event.body || '{}');

    if (body.action === 'postCreate' && body.post) {
      //get all connected group members
      checkRequiredKeys(['postedBy', 'groupId', 'body'], body.post);
      const connectionsIds = await getGroupConnections(body.post.groupId);
      log('connectionsIds: ', connectionsIds);
      
      //save post
      const post = createPostObj(body.post);
      const saveRes = await savePost({post: post, table: 'secondary'});
      log('saveRes: ', saveRes);

      //send post to all connected group members
      const message = {action: 'postCreated', post};
      const postToConnectionsRes = await Promise.all(sendToMultipleConnections({connectionsIds, apiGatewayClient, message}));
      log('postToConnectionsRes: ', postToConnectionsRes);

      return wsRes(201, { action: 'postCreateResponse', post, ok: true, message: 'Post created successfully' });
    }
    else {
      log('Invalid action or post data'); log('event: ', event);
      throw new ResponseError(400, 'Invalid action or post data');
    }
    
  } catch (error) {
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

