import { PostConfirmationConfirmSignUpTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';
import * as dotenv from 'dotenv';
import { log } from 'console';
dotenv.config();



const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });



export async function handler(event: PostConfirmationConfirmSignUpTriggerEvent) {
    try {
      log('Post Confirmation Hook runs...')
      log('Event: ', event);
      const userPoolId = event.userPoolId;
      const userName = event.userName;
      const email = event.request.userAttributes.email;
      const nickname = email.split('@')[0];
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: userName,
        UserAttributes: [
          {
            Name: 'nickname',
            Value: nickname
          }
        ]
      });
      await cognitoClient.send(command);
      return event; //must return event or aws-amplify on the FE errors out
    } catch (error) {
        if (error instanceof Error || error instanceof ResponseError) {
            return res(
                (error as ResponseError).statusCode || 500, 
                {error: error.message || 'Something went wrong'}
            );
        }
        return event;
    }
}