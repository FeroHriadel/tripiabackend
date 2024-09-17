import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { checkRequiredKeys, res } from '../utils';
import { batchGettrips } from '../dbOperations';
import { ResponseError } from '../ResponseError';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body!);
    const requiredKeys = ['tripIds'];
    checkRequiredKeys(requiredKeys, body);

    const { tripIds } = body;
    const trips = await batchGettrips(tripIds);
    return res(200, {trips});

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



