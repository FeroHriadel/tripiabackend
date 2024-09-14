import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getCreatedByFromUri, getLastEvaluatedKeyFromUri, res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getTripById, getAllTrips, getTripsBySearchword, getTripsByCreatedBy} from '../dbOperations';



const defaultPageSize = 3;



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        if (event.queryStringParameters?.id) {
            const id = event.queryStringParameters.id;
            const trip = await getTripById(id);
            return res(200, trip);
        } else if (event.queryStringParameters?.searchword) {
            const searchword = event.queryStringParameters.searchword;
            const pageSize = event.queryStringParameters?.pageSize ? parseInt(event.queryStringParameters.pageSize) : defaultPageSize;
            const lastEvaluatedKey = getLastEvaluatedKeyFromUri(event);
            const trips = await getTripsBySearchword({searchword, pageSize, lastEvaluatedKey});
            trips.items?.sort((a, b) => { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() });
            return res(200, trips);
        } else if (event.queryStringParameters?.createdBy) {
            const createdBy = getCreatedByFromUri(event);
            const trips = await getTripsByCreatedBy(createdBy);
            return res(200, trips);
        } else {
            const lastEvaluatedKey = getLastEvaluatedKeyFromUri(event);
            const pageSize = event.queryStringParameters?.pageSize ? parseInt(event.queryStringParameters.pageSize) : defaultPageSize;
            const allTrips = await getAllTrips({lastEvaluatedKey, pageSize});
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