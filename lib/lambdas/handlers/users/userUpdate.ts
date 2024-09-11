import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { res, checkRequiredKeys, getUserEmail, isAdmin } from '../utils';
import { getUserByEmail, updateUser } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const body = JSON.parse(event.body!)
      const requiredKeys = ['email', 'nickname', 'profilePicture'];
      checkRequiredKeys(requiredKeys, body);
      const {email, nickname, profilePicture} = body;

      const requestUserEmail = getUserEmail(event);
      const isUserAdmin = isAdmin(event);
      if (!isUserAdmin || requestUserEmail !== email) throw new ResponseError(403, 'Unauthorized');

      const userExists = await getUserByEmail(email);
      if (!userExists) throw new ResponseError(404, 'User not found');
      
      const updatedUser = await updateUser({nickname, profilePicture, email});
      return res(200, updatedUser);

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