import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getEncodedStringFromUri, getLastEvaluatedKeyFromUri, res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getCommentById, getComments, getTripsBySearchword, getTripsByCreatedBy} from '../dbOperations';



const defaultPageSize = 3;



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        if (event.queryStringParameters?.commentId) {
            const id = event.queryStringParameters.commentId;
            const comment = await getCommentById(id);
            return res(200, comment);
        } else {
            const tripId = event.queryStringParameters?.tripId; if (!tripId) throw new ResponseError(400, 'Missing tripId');
            const lastEvaluatedKey = getLastEvaluatedKeyFromUri(event);
            const pageSize = event.queryStringParameters?.pageSize ? parseInt(event.queryStringParameters.pageSize) : defaultPageSize;
            const comments = await getComments({lastEvaluatedKey, pageSize, tripId});
            return res(200, comments);
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