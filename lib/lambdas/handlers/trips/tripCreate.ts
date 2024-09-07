import { v4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { checkRequiredKeys, res, getUserEmail } from '../utils';
import { Trip } from '../../../../types';
import { saveTrip } from '../dbOperations';
import { ResponseError } from '../ResponseError';



interface CreateTripObjProps {
  name: string;
  departureTime: string;
  departureFrom: string;
  destination: string;
  description: string;
  createdBy: string;
}


function createTripObject(props: CreateTripObjProps) {
  const { name, departureTime, departureFrom, destination, description, createdBy } = props;
  const trip: Trip = {
    id: v4(),
    name,
    name_lower: name.toLowerCase(),
    departureTime,
    departureFrom,
    destination,
    description,
    description_lower: description.toLowerCase(),
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: '#TRIP',
  };
  return trip;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body!);
    const requiredKeys = ['name', 'departureTime', 'departureFrom', 'destination', 'description'];
    checkRequiredKeys(requiredKeys, body);

    const { name, departureTime, departureFrom, destination, description } = body;
    const createdBy = getUserEmail(event);
    const tripToSave = createTripObject({name, departureTime, departureFrom, destination, description, createdBy});
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



