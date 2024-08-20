import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getCategoryById, getAllCategories} from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        if (event.queryStringParameters?.id) {
            const id = event.queryStringParameters.id;
            const category = await getCategoryById(id);
            return res(200,category);
        } else {
            const allCategories = await getAllCategories();
            return res(200, allCategories);
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