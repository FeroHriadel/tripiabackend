import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DeleteObjectsCommand, DeleteObjectsCommandInput, S3Client } from '@aws-sdk/client-s3';
import { res, log, structureImagesToDeleteForEventBus } from '../utils';
import { ResponseError } from '../ResponseError';
import { deletePostsByIds, getPostsByGroupId } from '../dbOperations';
import { Post } from '../../../../types';
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



function getImagesUrlsFromPosts(posts: Post[]) {
  let imagesUrls: string[] = [];
  posts.forEach(post => { if (post.images) { imagesUrls = imagesUrls.concat(post.images) } });
  log('imagesUrls', imagesUrls);
  return imagesUrls
}

function getDeleteImagesPutEventParams(imagesUrlsToDelete: string[]) {
  const params = {
      Entries: [
          {
              Source: process.env.EVENT_BUS_SOURCE,
              DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
              EventBusName: process.env.EVENT_BUS_NAME,
              Detail: JSON.stringify({images: structureImagesToDeleteForEventBus(imagesUrlsToDelete)}),
              Resources: []
          }
      ]
  };
  log('Delete Images EventBus params: ', params);
  return params;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        //get groupId from event.eventType.detail
        console.log('Event is: ', event);
        const groupId: string = (event as any).detail?.groupId; log('groupId: ', groupId);
        if (!groupId) throw new ResponseError(400, 'Did not receive groupId');

        //get all posts from that group, their ids and images
        const posts = await getPostsByGroupId({groupId}); log('posts: ', posts);
        if (posts.length === 0) return res(200, {message: 'No posts to delete', id: groupId});
        const postIds = posts.map(post => post.id); log('postIds: ', postIds);
        const imagesUrls = getImagesUrlsFromPosts(posts);

        //delete the posts
        await deletePostsByIds({postIds});

        //delete posts' images
        if (imagesUrls.length > 0) {
          const deleteImageParams = getDeleteImagesPutEventParams(imagesUrls);
          const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImageParams))
          log('deleteImagesEventBus response: ', eventBusRes);
        }

        return res(200, {message: 'Deleted', id: groupId});

    } catch (error) {
        if (error instanceof Error || error instanceof ResponseError) {
            return res(
                (error as ResponseError).statusCode || 500, 
                {error: error.message || 'Something went wrong'}
            );
        }
        return res(500, {error: 'Something went wrong'});
    }
}