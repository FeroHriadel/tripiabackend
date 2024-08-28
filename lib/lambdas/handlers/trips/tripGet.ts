import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getTripById, getAllTrips} from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        if (event.queryStringParameters?.id) {
            const id = event.queryStringParameters.id;
            const trip = await getTripById(id);
            return res(200, trip);
        } else {
            const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey 
            ? 
            JSON.parse(decodeURIComponent(event.queryStringParameters.lastEvaluatedKey))
            : 
            undefined;
            const allTrips = await getAllTrips(lastEvaluatedKey);
            return res(200, allTrips);
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