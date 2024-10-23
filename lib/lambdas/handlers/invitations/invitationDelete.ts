import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, getUserEmail, isAdmin } from '../utils';
import { ResponseError } from '../ResponseError';
import { deleteInvitation, getInvitationById } from "../dbOperations";
import { Invitation } from '../../../../types';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const isUserAdmin = isAdmin(event);       
        const id = event.pathParameters?.id;

        if (!isUserAdmin) {
          const userEmail = getUserEmail(event);
          const invitation: Invitation = await getInvitationById({id: id!});
          if (invitation.invitee !== userEmail) throw new ResponseError(403, 'Unauthorized');
        }

        const deleteInvitationResponse = await deleteInvitation({id: id!});
        if (!deleteInvitationResponse) throw new ResponseError(500, 'Deletion failed');
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