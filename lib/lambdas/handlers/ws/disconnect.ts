import { ResponseError } from '../ResponseError';
import { deleteConnection } from '../dbOperations';



export const handler = async (event: any) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const res = await deleteConnection(connectionId);
    return { statusCode: 200, body: 'Disconnected' };

  } catch (error) {
    if (error instanceof Error || error instanceof ResponseError) {
      return {statusCode: (error as ResponseError).statusCode || 500, error: error.message || 'Something went wrong'}      
    }
    else return {statusCode: 500, error: 'Something went wrong'};
  }
};
