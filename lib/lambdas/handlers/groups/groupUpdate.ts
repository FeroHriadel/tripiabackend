import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { adminOnly, res } from '../utils';
import { getGroupById, updateGroup } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        adminOnly(event);
        const id = event.pathParameters?.id;
        const newName = JSON.parse(event.body!).name;
        if (!id || !newName) throw new ResponseError(400, 'id and new name are required');

        const groupExists = await getGroupById(id);
        if (!groupExists) throw new ResponseError(404, 'Group with such id not found');
        
        const updatedGroup = await updateGroup(id, newName);
        return res(200, updatedGroup);

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