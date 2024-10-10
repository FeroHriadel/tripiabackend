import { ResponseError } from '../ResponseError';
import { saveConnection } from '../dbOperations';



export const handler = async (event: any) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const groupId = event.queryStringParameters.groupId;
    if (!groupId) throw new ResponseError(400, 'groupId is required');
    const res = await saveConnection(connectionId, groupId);
    return { statusCode: 200, body: 'Connected' };

  } catch (error) {
    if (error instanceof Error || error instanceof ResponseError) {
      return {statusCode: (error as ResponseError).statusCode || 500, error: error.message || 'Something went wrong'}      
    }
    else return {statusCode: 500, error: 'Something went wrong'};
  }
};
