import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getUserEmail, isAdmin, res, structureImagesToDeleteForEventBus, log } from '../utils';
import { ResponseError } from '../ResponseError';
import { deleteComment, getCommentById } from "../dbOperations";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



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



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const body = JSON.parse(event.body as string);
      if (!body.id) throw new ResponseError(400, 'Id is required');

      const comment = await getCommentById(body.id);
      if (!comment) throw new ResponseError(404, 'Comment not found');

      const userEmail = getUserEmail(event);
      const isUserAdmin = isAdmin(event);
      if (!isUserAdmin) { if (comment.by !== userEmail) throw new ResponseError(403, 'You are not authorized to delete this comment'); }
      
      const deleteCommentResponse = await deleteComment(body.id);
      if (!deleteCommentResponse) throw new ResponseError(500, 'Deletion failed');

      if (comment.image !== '') {
        const deleteImageParams = getPutEventParams([comment.image]);
        const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImageParams));
        log('deleteImagesEventBus response: ', eventBusRes);
      }

      return res(200, {message: 'Deleted', id: body.id})

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