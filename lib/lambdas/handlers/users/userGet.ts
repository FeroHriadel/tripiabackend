import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getUserByEmail } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event.body!);
        const email = body.email;
        if (!email) throw new ResponseError(400, 'email is required');
        const user = await getUserByEmail({email});
        return res(200, user);

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