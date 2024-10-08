import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, adminOnly, getUserEmail } from '../utils';
import { ResponseError } from '../ResponseError';
import { getCategoryById, deleteCategory, deleteGroup, getUserByEmail, getGroupById } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const userEmail = getUserEmail(event);
        const id = event.pathParameters?.id; if (!id) throw new ResponseError(400, 'id is required');
        const group = await getGroupById(id);
        if (group.createdBy !== userEmail) throw new ResponseError(403, 'You are not authorized to delete this group');

        const deleteGroupResponse = await deleteGroup(id!);
        if (!deleteGroupResponse) throw new ResponseError(500, 'Deletion failed');
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