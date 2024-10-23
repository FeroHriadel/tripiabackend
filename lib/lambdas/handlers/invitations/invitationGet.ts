import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, getUserEmail } from '../utils';
import { ResponseError } from '../ResponseError';
import { getInvitationsByInvitee } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const email = getUserEmail(event);
    const invitations = await getInvitationsByInvitee(email);
    return res(200, invitations);
      
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