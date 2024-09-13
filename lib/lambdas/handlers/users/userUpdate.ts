import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ResponseError } from '../ResponseError';
import { res, checkRequiredKeys, getUserEmail, isAdmin, structureImagesToDeleteForEventBus, log } from '../utils';
import { getUserByEmail, updateUser } from "../dbOperations";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"



const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



function getPutEventParams(imagesUrlsToDelete: string[]) {
    const params = {
        Entries: [
            {
                Source: process.env.EVENT_BUS_SOURCE,
                DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
                EventBusName: process.env.EVENT_BUS_NAME,
                Detail: JSON.stringify({images: structureImagesToDeleteForEventBus(imagesUrlsToDelete)}), //eventBridge cannot do arrays - must be an object
                Resources: []
            }
        ]
    };
    console.log('Event bus params: ', params);
    return params;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
      const body = JSON.parse(event.body!)
      const requiredKeys = ['email', 'nickname', 'profilePicture', 'about'];
      checkRequiredKeys(requiredKeys, body);
      let {email, nickname, profilePicture, about} = body;
      if (!profilePicture) profilePicture = '';
      if (!about) about = '';

      const requestUserEmail = getUserEmail(event);
      const isUserAdmin = isAdmin(event);

      console.log('requestUserEmail, isUserAdmin, email');
      console.log(requestUserEmail, isUserAdmin, email);

      if (!isUserAdmin) {
        if (requestUserEmail !== email) throw new ResponseError(403, 'Unauthorized');
      }

      const userExists = await getUserByEmail({email});
      if (!userExists) throw new ResponseError(404, 'User not found');

      if ((userExists.profilePicture !== '') && (profilePicture !== userExists.profilePicture)) {
        const deleteImageParams = getPutEventParams([userExists.profilePicture]);
        const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImageParams));
        log('deleteImagesEventBus response: ', eventBusRes);
      }
      
      const updatedUser = await updateUser({nickname, profilePicture, email, about});
      return res(200, updatedUser);

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