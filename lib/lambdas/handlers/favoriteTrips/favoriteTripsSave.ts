/*************************************************************************************
* called SAVE not CREATE bc it will serve to create, update and delete favoriteTrips
**************************************************************************************/

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'; 
import { checkRequiredKeys, res, getUserEmail } from '../utils';
import { FavoriteTrips } from '../../../../types';
import { saveFavoriteTrips } from '../dbOperations';
import { ResponseError } from '../ResponseError';



interface CreateFavoriteTripObjProps {
  email: string;
  tripIds: string[];
}


function createFavoriteTripsObject(props: CreateFavoriteTripObjProps) {
  const { email, tripIds } = props;
  const favoriteTrips: FavoriteTrips = {
    email,
    tripIds,
    updatedAt: new Date().toISOString(),
    type: '#FAVORITE_TRIPS'
  };
  return favoriteTrips;
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body!);
    const requiredKeys = ['tripIds'];
    checkRequiredKeys(requiredKeys, body);

    const { tripIds } = body;
    const email = getUserEmail(event);
 
    const favoriteTripsToSave = createFavoriteTripsObject({tripIds, email});
    const saveFavoriteTripsResponse = await saveFavoriteTrips(favoriteTripsToSave);
    if (!saveFavoriteTripsResponse) throw new ResponseError(500, 'Favorite Trips were not saved.');
    
    return res(201, favoriteTripsToSave);

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



