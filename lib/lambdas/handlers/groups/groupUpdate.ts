import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { adminOnly, checkRequiredKeys, getUserEmail, isAdmin, res, log } from '../utils';
import { getGroupById, getInvitationById, updateGroup, updateGroupMembers, deleteInvitation } from '../dbOperations';
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



function toggleGroupMember(groupMembers: string[], userEmail: string): string[] {
    const index = groupMembers.indexOf(userEmail);
    if (index === -1) groupMembers.push(userEmail) 
    else groupMembers.splice(index, 1);
    return groupMembers;
}

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
        //get group
        const body = JSON.parse(event.body!);
        const id = event.pathParameters!.id;
        const groupExists = await getGroupById(id!);
        if (!groupExists) throw new ResponseError(404, 'Group with such id not found');

        //check user
        const isUserAdmin = isAdmin(event);
        const userEmail = getUserEmail(event);

        //if group.name update
        if (body.name) {
            const newName = body.name;
            if (!isUserAdmin) { if (groupExists.createdBy !== userEmail) throw new ResponseError(403, 'Unauthorized'); };
            const updatedGroup = await updateGroup(id!, newName);
            return res(200, updatedGroup);

        //if group.members update (user was invited to group)
        } else if (body.invitationId) {
            const { invitationId } = body;
            const invitation = await getInvitationById({id: invitationId, table: 'secondary'}); if(!invitation) throw new ResponseError(404, 'Invitation not found');
            const updatedMembers = [...groupExists.members, invitation.invitee];
            const updatedGroup = await updateGroupMembers({id: id!, members: updatedMembers, table: 'primary'});
            const busParams = getPutEventParams(userEmail, groupExists.id);
            const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(busParams));
            log('Bus response: ', eventBusRes);
            const deleteInvitationRes = await deleteInvitation({id: invitationId, table: 'secondary'});
            return res(200, updatedGroup);

        //if group.members update (user leaves or joins group)
        } else {
            checkRequiredKeys(['email'], body);
            if (!isUserAdmin) { if (!groupExists.members.includes(userEmail)) throw new ResponseError(403, 'Unauthorized'); }
            const updatedMembers = toggleGroupMember(groupExists.members, body.email);
            const updatedGroup = await updateGroupMembers({id: id!, members: updatedMembers, table: 'primary'});
            const busParams = getPutEventParams(body.email, groupExists.id); //remove/add group in User.groups
            const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(busParams));
            log('Bus response: ', eventBusRes);
            return res(200, updatedGroup);
        }

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