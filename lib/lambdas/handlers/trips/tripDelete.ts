import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getTripById, deleteCategory } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const id = event.pathParameters?.id;
        const tripExists = await getTripById(id!);
        if (!tripExists) throw new ResponseError(404, 'Trip with such id not found');
        
        const deleteTripResponse = await deleteCategory(id!);
        if (!deleteTripResponse) throw new ResponseError(500, 'Deletion failed');
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