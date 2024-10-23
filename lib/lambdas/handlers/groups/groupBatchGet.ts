import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, getUserEmail, checkRequiredKeys } from '../utils';
import { ResponseError } from '../ResponseError';
import { getGroupsByIds, getUserByEmail } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const body = JSON.parse(event.body || '{}');
      checkRequiredKeys(['ids'], body);
      const groups = await getGroupsByIds(body.ids);
      return res(200, groups);

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