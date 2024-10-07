import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getTripById, deleteTrip } from "../dbOperations";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { structureImagesToDeleteForEventBus, log, getUserEmail, isAdmin } from '../utils';
import { error } from 'console';



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



function getDeleteImagesPutEventParams(imagesUrlsToDelete: string[]) {
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
    log('Delete Images EventBus params: ', params);
    return params;
}

function getDeleteCommentsPutEventParams(tripId: string) {
    const params = {
        Entries: [
            {
                Source: process.env.SECONDARY_EVENT_BUS_SOURCE,
                DetailType: process.env.SECONDARY_EVENT_BUS_DETAIL_TYPE,
                EventBusName: process.env.SECONDARY_EVENT_BUS_NAME,
                Detail: JSON.stringify({tripId}),
                Resources: []
            }
        ]
    };
    log('Delete Comments EventBus params: ', params);
    return params;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const id = event.pathParameters?.id;
        const tripExists = await getTripById(id!);
        if (!tripExists) throw new ResponseError(404, 'Trip with such id not found');

        const isUserAdmin = isAdmin(event);
        if (!isUserAdmin) {
            const requestUser = getUserEmail(event);
            if (requestUser !== tripExists.createdBy) throw new ResponseError(403, 'Forbidden');
        }
        
        const deleteTripResponse = await deleteTrip(id!);
        if (!deleteTripResponse) throw new ResponseError(500, 'Deletion failed');

        if (tripExists.image !== '') {
            const deleteImageParams = getDeleteImagesPutEventParams([tripExists.image])
            const eventBusRes = eventBridgeClient.send(new PutEventsCommand(deleteImageParams)).catch(error => log('deleteImagesBus error:', error)); //not awaiting for faster lambda response
            log('deleteImagesEventBus response: ', eventBusRes);
        }

        const deleteCommentsPutEventParams = getDeleteCommentsPutEventParams(tripExists.id);
        const eventBusRes = eventBridgeClient.send(new PutEventsCommand(deleteCommentsPutEventParams)).catch(error => log('deleteCommentsBus error:', error)); //not awaiting for faster lambda response
        log('deleteCommentsEventBus response: ', eventBusRes);

        return res(200, {message: 'Deleted', id});

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