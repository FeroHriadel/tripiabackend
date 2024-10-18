import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { v4 } from 'uuid';
import { ResponseError } from '../ResponseError';
import { checkRequiredKeys, log, wsRes, sendToWSConnections, getWsUserEmail, isUserAdminWs, structureImagesToDeleteForEventBus } from '../utils';
import { getGroupConnections, deletePost, getPostById } from '../dbOperations';
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";



const endpointWithHttps = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss', 'https'); //ApiGatewayManagementApiClien needs the ws enpoint to start with `https`, not `wss`
const apiGatewayClient = new ApiGatewayManagementApiClient({endpoint: endpointWithHttps});
const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



interface CreatePostObjProps {
  postedBy: string; 
  groupId: string; 
  body: string; 
  images?: string[];
}



function getPutEventParams(imagesUrlsToDelete: string[]) {
  const params = {
      Entries: [
          {
              Source: process.env.EVENT_BUS_SOURCE,
              DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
              EventBusName: process.env.EVENT_BUS_NAME,
              Detail: JSON.stringify({images: structureImagesToDeleteForEventBus(imagesUrlsToDelete)}), //eventBridge cannot do arrays - must be an object
              Resources: []
          }
      ]
  };
  log('Event bus params: ', params);
  return params;
}



export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  try {
    if (!connectionId) throw new ResponseError(400, 'Failed to get connectionId');
    log('connectionId: ', connectionId);

    //get body
    const body = JSON.parse(event.body || '{}');
    log('body: ', body);
    checkRequiredKeys(['groupId', 'postId'], body);

    //get post
    const post = await getPostById({id: body.postId, table: 'secondary'});
    log('post: ', post);
    if (!post) throw new ResponseError(404, 'Post not found');

    //get user's email & role
    const userEmail = getWsUserEmail(event);
    const isAdmin = isUserAdminWs(event);
    log('userEmail: ', userEmail);
    log('isAdmin: ', isAdmin);

    //admin & owner only
    if (!isAdmin) {if (post.postedBy !== userEmail) { throw new ResponseError(403, 'Forbidden'); }}

    //get all connected group members
    const connectionsIds = await getGroupConnections(body.groupId);
    log('connectionsIds: ', connectionsIds);
    
    //delete post
    const deleteRes = await deletePost({id: body.postId, table: 'secondary'});
    log('deleteRes: ', deleteRes);

    //send deletion notification to all connected group members
    const message = {action: 'postDelete', ok: true, id: body.postId};
    await Promise.all(sendToWSConnections({connectionsIds, apiGatewayClient, message}));

    //delete post.images if any
    if (Array.isArray(post.images) && post.images.length > 0) {
      const deleteImageParams = getPutEventParams(post.images);
      const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImageParams));
      log('deleteImagesEventBus response: ', eventBusRes);
    }

    //FE doesn't get this but chatGPT says this is mandatory. So I keep this line just in case
    return wsRes(200, message);
    
  } catch (error) {
    log('error: ', error);
    const message = {action: 'postDelete', error: 'Failed to delete post'};
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

