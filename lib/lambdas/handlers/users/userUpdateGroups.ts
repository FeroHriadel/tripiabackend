import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { log, res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getUserByEmail, updateUser } from '../dbOperations';
import { User } from '../../../../types';



function toggleGroup(groups: string[], groupId: string) {
  if (groups.includes(groupId)) return groups.filter(group => group !== groupId);
  else return [...groups, groupId];
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        //get groupId & userEmail from event
        log('Event is: ', event);
        const { groupId, userEmail } = (event as any).detail;
        
        //get user
        const user: User = await getUserByEmail({email: userEmail});
        log('Found user: ', user);

        //add/remove group
        const updatedGroups = toggleGroup(user.groups, groupId);
        user.groups = updatedGroups;
        const updatedUser = await updateUser(user);
        log('Updated user: ', updatedUser);
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