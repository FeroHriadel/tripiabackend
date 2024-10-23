import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, adminOnly, getUserEmail, isAdmin, log } from '../utils';
import { ResponseError } from '../ResponseError';
import { getCategoryById, deleteCategory, deleteGroup, getUserByEmail, getGroupById } from "../dbOperations";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



function getPutEventParams(userEmail: string, groupId: string) {
    const params = {
        Entries: [
            {
                Source: process.env.EVENT_BUS_SOURCE,
                DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
                EventBusName: process.env.EVENT_BUS_NAME,
                Detail: JSON.stringify({userEmail, groupId}),
                Resources: []
            }
        ]
    };
    console.log('Event bus params: ', params);
    return params;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const userEmail = getUserEmail(event);
        const id = event.pathParameters?.id; if (!id) throw new ResponseError(400, 'id is required');
        const group = await getGroupById(id);
        if (group.createdBy !== userEmail) { if (!isAdmin(event)) throw new ResponseError(403, 'Forbidden'); }

        const deleteGroupResponse = await deleteGroup(id!);
        if (!deleteGroupResponse) throw new ResponseError(500, 'Deletion failed');

        const busParams = getPutEventParams(userEmail, id);
        const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(busParams));
        log('Bus response: ', eventBusRes);

        return res(200, {message: 'Deleted', id})

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