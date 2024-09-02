import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { res, checkRequiredKeys } from '../utils';
import { getTripById, updateTrip } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const id = event.pathParameters?.id;
        const body = JSON.parse(event.body!);
        const requiredKeys = ['name', 'departureTime', 'departureFrom', 'destination', 'description'];
        checkRequiredKeys(requiredKeys, body);

        const tripExists = await getTripById(id!);
        if (!tripExists) throw new ResponseError(404, 'Trip with such id not found');
        
        const updatedTrip = await updateTrip({...body, id});
        return res(200, updatedTrip);

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