import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { res, adminOnly, getUserEmail } from '../utils';
import { Group } from '../../../../types';
import { getCategoryByName, saveCategory, saveGroup } from '../dbOperations';
import { ResponseError } from '../ResponseError';



function createGroupObject(props: {name: string, createdBy: string}) {
  const { name, createdBy } = props;
  const group: Group = {
      id: v4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      members: [createdBy],
      name: name,
      type: '#GROUP'
  };
  return group;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const userEmail = getUserEmail(event);
    if (!userEmail) throw new ResponseError(401, 'Unauthorized');
    const body = JSON.parse(event.body!);
    if (!body.name) throw new ResponseError(400, 'Group must have a name');

    const groupToSave = createGroupObject({name: body.name, createdBy: userEmail});
    const saveGroupResponse = await saveGroup(groupToSave);
    if (!saveGroupResponse) throw new ResponseError(500, 'Group was not saved.');
    
    return res(201, groupToSave);

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



