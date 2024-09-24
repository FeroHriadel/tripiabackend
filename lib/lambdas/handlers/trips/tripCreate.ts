import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { checkRequiredKeys, res, getUserEmail } from '../utils';
import { Trip } from '../../../../types';
import { getUserByEmail, saveTrip } from '../dbOperations';
import { ResponseError } from '../ResponseError';



interface CreateTripObjProps {
  name: string;
  departureTime: string;
  departureDate: string;
  departureFrom: string;
  destination: string;
  description: string;
  createdBy: string;
  nickname: string;
  category?: string;
  keyWords?: string;
  image?: string;
  requirements?: string;
  meetingLat?: number | null | undefined; 
  meetingLng?: number | null | undefined; 
  destinationLat?: number | null | undefined; 
  destinationLng?: number | null | undefined;
}


function createTripObject(props: CreateTripObjProps) {
  const { name, departureTime, departureDate, departureFrom, destination, description, createdBy, nickname, category, keyWords, image, requirements, meetingLat, meetingLng, destinationLat, destinationLng } = props;
  const trip: Trip = {
    id: v4(),
    name,
    name_lower: name.toLowerCase(),
    departureTime,
    departureDate,
    departureFrom,
    destination,
    description,
    description_lower: description.toLowerCase(),
    createdBy,
    nickname,
    nickname_lower: nickname.toLowerCase(), //so we can search trips by user nickname case-insensitive & partial-string. What a wonderful database dynamoDB is...
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: '#TRIP',
    category,
    keyWords: keyWords?.toLowerCase() || '',
    image,
    requirements: requirements || '',
    meetingLat,
    meetingLng,
    destinationLat,
    destinationLng
  };
  return trip;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body!);
    const requiredKeys = ['name', 'departureTime', 'departureFrom', 'destination', 'description'];
    checkRequiredKeys(requiredKeys, body);

    const { name, departureTime, departureDate, departureFrom, destination, description, category, keyWords, image, requirements, meetingLat, meetingLng, destinationLat, destinationLng } = body;

    const createdBy = getUserEmail(event);
    const user = await getUserByEmail({email: createdBy, table: 'secondary'});
    const nickname = user.nickname;
    const tripToSave = createTripObject({name, departureTime, departureDate, departureFrom, destination, description, createdBy, nickname, category, keyWords, image, requirements, meetingLat, meetingLng, destinationLat, destinationLng });
    const saveTripResponse = await saveTrip(tripToSave);
    if (!saveTripResponse) throw new ResponseError(500, 'Trip was not saved.');
    
    return res(201, tripToSave);

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



