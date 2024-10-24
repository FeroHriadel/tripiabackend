import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { res, adminOnly, getUserEmail, log } from '../utils';
import { Group } from '../../../../types';
import { getCategoryByName, saveCategory, saveGroup } from '../dbOperations';
import { ResponseError } from '../ResponseError';
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



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

function getPutEventParams(userEmail: string, groupId: string) {
  const params = {
      Entries: [
          {
              Source: process.env.EVENT_BUS_SOURCE,
              DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
              EventBusName: process.env.EVENT_BUS_NAME,
              Detail: JSON.stringify({userEmail, groupId}),
              Resources: []
          }
      ]
  };
  console.log('Event bus params: ', params);
  return params;
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

    const busParams = getPutEventParams(userEmail, groupToSave.id); //add group to User.groups
    const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(busParams));
    log('Bus response: ', eventBusRes);
    
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



