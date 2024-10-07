import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, getEncodedStringFromUri, getUserEmail } from '../utils';
import { ResponseError } from '../ResponseError';
import { getGroupById, getGroupsByEmail } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        if (event.queryStringParameters?.id) {
            const id = event.queryStringParameters.id;
            const group = await getGroupById(id);
            return res(200, group);
        } else if (event.queryStringParameters?.email) {
            const email = getUserEmail(event);
            const groups = await getGroupsByEmail(email);
            return res(200, groups);
        } else {
            return res(400, {error: 'Invalid query parameters'});
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