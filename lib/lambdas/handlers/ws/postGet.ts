import { ResponseError } from '../ResponseError';
import { getPostsByGroupId } from '../dbOperations';
import { wsRes, log } from '../utils';
import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';



export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  try {
    const groupId = event.queryStringParameters?.groupId;
    if (!groupId) throw new ResponseError(400, 'groupId is required');

    const posts = await getPostsByGroupId({groupId, table: 'primary'});
    log('posts: ', posts);

    return wsRes(200, {action: 'posts', posts});
    
  } catch (error) {
    if (error instanceof Error || error instanceof ResponseError) {
      return wsRes(
        (error as ResponseError).statusCode || 500,
        {error: error.message || 'Something went wrong'}
      )   
    }
    else return wsRes(
      500,
      {error: (error as any).message || 'Something went wrong'}
    )
  }
};