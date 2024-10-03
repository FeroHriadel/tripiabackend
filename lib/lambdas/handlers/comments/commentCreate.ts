import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { res, checkRequiredKeys } from '../utils';
import { Comment } from '../../../../types';
import { getTripById, saveComment } from '../dbOperations';
import { ResponseError } from '../ResponseError';



function createCommentObject(body: any): Comment {
  return {
    id: v4(),
    by: body.by,
    body: body.body,
    image: body.image || '',
    trip: body.trip,
    createdAt: body.createdAt,
    type: '#COMMENT'
  };
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    
    const body = JSON.parse(event.body!);
    const requiredKeys = ['body', 'by', 'trip', 'createdAt']; //createdAt comes from FE to avoid timezone problems
    checkRequiredKeys(requiredKeys, body);

    const tripExists = await getTripById(body.trip, 'secondary');
    if (!tripExists) throw new ResponseError(404, 'Trip not found');

    const commentToSave = createCommentObject(body);
    const savedCommentResponse = await saveComment(commentToSave);
    if (!savedCommentResponse) throw new ResponseError(500, 'Comment was not saved.');
    
    return res(201, commentToSave);

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



