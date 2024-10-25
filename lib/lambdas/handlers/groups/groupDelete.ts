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

function getPostBatchDeleteEventParams(groupId: string) {
    const params = {
        Entries: [
            {
                Source: process.env.SECONDARY_EVENT_BUS_SOURCE,
                DetailType: process.env.SECONDARY_EVENT_BUS_DETAIL_TYPE,
                EventBusName: process.env.SECONDARY_EVENT_BUS_NAME,
                Detail: JSON.stringify({groupId}),
                Resources: []
            }
        ]
    };
    console.log('Event bus params: ', params);
    return params;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        //get user and group
        const userEmail = getUserEmail(event);
        const id = event.pathParameters?.id; if (!id) throw new ResponseError(400, 'id is required');
        const group = await getGroupById(id);
        if (group.createdBy !== userEmail) { if (!isAdmin(event)) throw new ResponseError(403, 'Forbidden'); }

        //delete group
        const deleteGroupResponse = await deleteGroup(id!);
        if (!deleteGroupResponse) throw new ResponseError(500, 'Deletion failed');

        //delete group from User.groups
        const busParams = getPutEventParams(userEmail, id); //remove group from User.groups. For remaining members the group is removed on the FE calling groupUpdate endpoint when they log in and the group is no longer found.
        const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(busParams));
        log('Bus response: ', eventBusRes);

        //delete Group's Posts
        const postBatchDeleteBusParams = getPostBatchDeleteEventParams(id);
        const postBatchDeleteEventBusRes = await eventBridgeClient.send(new PutEventsCommand(postBatchDeleteBusParams));
        log('postBatchDeleteEventBus response: ', postBatchDeleteEventBusRes);

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