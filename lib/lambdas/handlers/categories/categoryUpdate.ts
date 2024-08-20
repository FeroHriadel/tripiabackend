import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { res } from '../utils';
import { getCategoryByName, getCategoryById, updateCategory } from "../dbOperations";



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const id = event.pathParameters?.id;
        const newName = JSON.parse(event.body!).name;
        if (!id || !newName) throw new ResponseError(400, 'id and new name are required');

        const categoryExists = await getCategoryById(id);
        if (!categoryExists) throw new ResponseError(404, 'Category with such id not found');

        const nameExists = await getCategoryByName(newName);
        if (nameExists) throw new ResponseError(403, 'Category with such name already exists'); 
        
        const updatedCategory = await updateCategory(id, newName);
        return res(200, updatedCategory);

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