import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { res, log, } from '../utils';
import { ErrorResponse } from 'aws-cdk-lib/aws-cloudfront';
import { Category } from '../../../../types';
import { getCategoryByName, saveCategory } from '../dbOperations';
import { ResponseError } from '../ResponseError';



function createCategoryObject(name: string) {
  const category: Category = {
      id: v4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: name.toLowerCase(),
      type: '#CATEGORY'
  };
  return category;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
      const body = JSON.parse(event.body!);
      if (!body.name) throw new ResponseError(400, 'Category must have a name');

      const nameExists = await getCategoryByName(body.name.toLowerCase());
      if (nameExists) throw new ResponseError(403, 'Category with such name already exists'); 

      const categoryToSave = createCategoryObject(body.name);
      const saveCategoryResponse = await saveCategory(categoryToSave);
      if (!saveCategoryResponse) throw new ResponseError(500, 'Category was not saved.');
      
      return res(201, categoryToSave);

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



