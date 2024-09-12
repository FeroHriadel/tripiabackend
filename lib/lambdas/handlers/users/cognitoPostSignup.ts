import { PostConfirmationConfirmSignUpTriggerEvent } from 'aws-lambda';
import { res, log } from '../utils';
import { ResponseError } from '../ResponseError';
import { User } from '../../../../types';
import { saveUser } from '../dbOperations';



function createUserObj(props: {email: string, nickname: string}): User {
  const { email, nickname } = props;
  return {
    email: email.toLowerCase(),
    nickname,
    nickname_lower: nickname.toLowerCase(),
    profilePicture: '',
    about: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: '#USER'
  }
}


export async function handler(event: PostConfirmationConfirmSignUpTriggerEvent) {
    try {
      log('Event: ', event);
      const email = event.request.userAttributes.email;
      const nickname = email.split('@')[0];
      const user = createUserObj({email, nickname});
      const saveUserResponse = await saveUser(user);
      log('Save user response: ', saveUserResponse);
      return event; //must return event or aws-amplify errors out on the FE
    } catch (error) {
        if (error instanceof Error || error instanceof ResponseError) {
            return res(
                (error as ResponseError).statusCode || 500, 
                {error: error.message || 'Something went wrong'}
            );
        }
    }
}