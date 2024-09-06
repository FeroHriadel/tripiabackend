import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { res, adminOnly } from '../utils';
import { ResponseError } from '../ResponseError';
import { getCategoryById, deleteCategory } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        adminOnly(event);
        const id = event.pathParameters?.id;
        const categoryExists = await getCategoryById(id!);
        if (!categoryExists) throw new ResponseError(404, 'Category with such id not found');
        
        const deleteCategoryResponse = await deleteCategory(id!);
        if (!deleteCategoryResponse) throw new ResponseError(500, 'Deletion failed');
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