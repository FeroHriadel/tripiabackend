import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { res, getUserEmail, checkRequiredKeys } from '../utils';
import { Invitation } from '../../../../types';
import { saveInvitation, getInvitationsByInvitee, getGroupById } from '../dbOperations';
import { ResponseError } from '../ResponseError';



function createInvitationObject(props: {
  groupId: string, 
  groupName: string, 
  invitedByEmail: string, 
  invitedByNickname: string, 
  invitedByImage?: string, 
  invitee: string
}) {
  let { groupId, groupName, invitedByEmail, invitedByNickname, invitedByImage, invitee } = props;
  if (!invitedByImage) invitedByImage = '';
  const invitation: Invitation = {
    id: v4(),
    groupId,
    groupName,
    invitedByEmail,
    invitedByNickname,
    invitedByImage,
    invitee,
    createdAt: new Date().toISOString(),
    type: '#INVITATION'
  };
  return invitation;
}

export function invitationExists(props: {invitee: string, groupId: string, invitations: Invitation[]}) {
  const { invitee, groupId, invitations } = props;
  const invitationExists = invitations.some(invitation => invitation.invitee === invitee && invitation.groupId === groupId);
  if (invitationExists) return true;
  else return false;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userEmail = getUserEmail(event);
    const body = JSON.parse(event.body!);
    checkRequiredKeys(['groupId', 'groupName', 'invitedByEmail', 'invitedByNickname', 'invitee'], body);
    if (userEmail !== body.invitedByEmail) throw new ResponseError(401, 'Unauthorized');

    const usersInvitations = await getInvitationsByInvitee(body.invitee);
    if (invitationExists({invitee: body.invitee, groupId: body.groupId, invitations: usersInvitations})) throw new ResponseError(400, 'Invitation already exists');

    const group = await getGroupById(body.groupId, 'secondary');
    if (group.members && group.members.includes(body.invitee)) throw new ResponseError(400, 'User is already a member');

    const invitationToSave = createInvitationObject({...body});
    const saveInvitationResponse = await saveInvitation(invitationToSave);
    if (!saveInvitationResponse) throw new ResponseError(500, 'Failed to send invitation.');

    return res(201, invitationToSave);

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



