import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { getEncodedStringFromUri, res } from '../utils';
import { ResponseError } from '../ResponseError';
import { getFavoriteTripsByEmail } from '../dbOperations';



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const email = getEncodedStringFromUri({event, queryStringKey: 'email'});
      if (!email) throw new ResponseError(400, 'Missing or badly encoded email');
      const trips = await getFavoriteTripsByEmail(email);
      return res(200, trips);

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