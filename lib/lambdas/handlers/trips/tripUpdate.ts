import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { res, checkRequiredKeys } from '../utils';
import { getTripById, updateTrip } from "../dbOperations";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { structureImagesToDeleteForEventBus, log, isAdmin, getUserEmail } from '../utils';



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
        const id = event.pathParameters?.id;
        const body = JSON.parse(event.body!);
        const requiredKeys = ['name', 'departureTime', 'departureFrom', 'destination', 'description'];
        checkRequiredKeys(requiredKeys, body);

        const tripExists = await getTripById(id!);
        if (!tripExists) throw new ResponseError(404, 'Trip with such id not found');

        const isUserAdmin = isAdmin(event);
        if (!isUserAdmin) {
            const requestUser = getUserEmail(event);
            if (requestUser !== tripExists.createdBy) throw new ResponseError(403, 'Forbidden');
        }

        if ((tripExists.image !== '') && (tripExists.image !== body.image)) {
            const deleteImageParams = getPutEventParams([tripExists.image]);
            const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImageParams));
            log('deleteImagesEventBus response: ', eventBusRes);
          }
        
        const updatedTrip = await updateTrip({...body, id});
        return res(200, updatedTrip);

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