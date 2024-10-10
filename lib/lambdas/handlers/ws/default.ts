import { ResponseError } from '../ResponseError';



export const handler = async (event: any) => {
  try {
    return { statusCode: 200, body: 'Pong' };
  } catch (error) {
    if (error instanceof Error || error instanceof ResponseError) {
      return {statusCode: (error as ResponseError).statusCode || 500, error: error.message || 'Something went wrong'}      
    }
    else return {statusCode: 500, error: 'Something went wrong'};
  }
};
