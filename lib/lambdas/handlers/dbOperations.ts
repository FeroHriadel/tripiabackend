import { DynamoDB, PutItemCommand, PutItemCommandInput, QueryCommandInput, BatchGetItemCommand, BatchGetItemCommandInput, BatchWriteItemCommand, BatchWriteItemCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient, GetCommand, UpdateCommand, UpdateCommandInput, DeleteCommand, DeleteCommandInput, ScanCommand, ScanCommandInput, PutCommand, PutCommandOutput, DeleteCommandOutput } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Category, FavoriteTrips, Trip, User, Comment, Group, Post } from "../../../types";
import { ResponseError } from './ResponseError';
import * as dotenv from 'dotenv';
dotenv.config();



const client = new DynamoDB({region: process.env.REGION});
const docClient = DynamoDBDocumentClient.from(client);



//CATEGORIES
export async function getCategoryByName(name: string) {
  const queryParams = {
      TableName: process.env.TABLE_NAME!,
      IndexName: 'name',
      KeyConditionExpression: '#name = :name',
      ExpressionAttributeNames: {'#name': 'name'},
      ExpressionAttributeValues: {':name': name}
  };
  const response = await docClient.send(new QueryCommand(queryParams));
  if (response.Items?.length !== 0 && Array.isArray(response.Items)) return response.Items[0];
  else return false;
}

export async function saveCategory(category: Category) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(category), 
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export async function getAllCategories() {
  const queryParams = {
      TableName: process.env.TABLE_NAME!,
      IndexName: 'nameSort',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {'#type': 'type'},
      ExpressionAttributeValues: {':type': '#CATEGORY'},
      ScanIndexForward: true,
  };
  const response = await docClient.send(new QueryCommand(queryParams));
  if (!response?.Items) throw new ResponseError(500, 'DB query failed');
  return response.Items;
}

export async function getCategoryById(id: string) {
  const getParams = {
      TableName: process.env.TABLE_NAME!,
      Key: {id},
  }
  const response = await docClient.send(new GetCommand(getParams));
  if (!response.Item) throw new ResponseError(404, 'Category not found');
  return response.Item;
}

export async function updateCategory(id: string, name: string) {
  const updateParams: UpdateCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id},
      UpdateExpression: 'set #name = :name, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {'#name': 'name', '#updatedAt': 'updatedAt'},
      ExpressionAttributeValues: {':name': name, ':updatedAt': new Date().toISOString()},
      ReturnValues: 'ALL_NEW'
  };
  const response = await docClient.send(new UpdateCommand(updateParams));
  if (!response?.Attributes) throw new ResponseError(500, 'Update failed');
  return response.Attributes;
}

export async function deleteCategory(id: string) {
  const deleteParams: DeleteCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id}
  }
  const response = await docClient.send(new DeleteCommand(deleteParams));
  return response;
}



//USERS
export async function saveUser(user: User) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Item: marshall(user),
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;  
}

export async function getUserByEmail(props: {email: string; table?: 'primary' | 'secondary'}) {
  let { email, table } = props;
  if (!table) table = 'primary';
  const getParams = {
      TableName: table === 'primary' ? process.env.TABLE_NAME! : process.env.SECONDARY_TABLE_NAME!,
      Key: {email},
  }
  const response = await docClient.send(new GetCommand(getParams));
  if (!response.Item) throw new ResponseError(404, 'User not found');
  return response.Item;
}

export async function updateUser(props: {nickname: string; profilePicture: string; email: string, about: string;}) {
  const { nickname, profilePicture, email, about } = props;
  const updateParams: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME!,
    Key: {email},
    UpdateExpression: 'set #nickname = :nickname, #nickname_lower = :nickname_lower, #profilePicture = :profilePicture, #about = :about, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {'#nickname': 'nickname', '#nickname_lower': 'nickname_lower', '#profilePicture': 'profilePicture', '#about': 'about', '#updatedAt': 'updatedAt'},
    ExpressionAttributeValues: {':nickname': nickname, ':nickname_lower': nickname.toLowerCase(), ':profilePicture': profilePicture, ':about': about,':updatedAt': new Date().toISOString()},
    ReturnValues: 'ALL_NEW'
  };
  const response = await docClient.send(new UpdateCommand(updateParams));
  if (!response?.Attributes) throw new ResponseError(500, 'Update failed');
  return response.Attributes;
}

export async function batchGetUsers(emails: string[]) {
  const tableName = process.env.TABLE_NAME!;
  const params = {
    RequestItems: {[tableName]: {Keys: emails.map(email => ({ email: { S: email } }))}},
  };

  try {
    const result = await client.send(new BatchGetItemCommand(params));
    const users = result.Responses?.[tableName] || [];
    return users.map(user => unmarshall(user));
  } catch (error) {
    console.error(error);
    throw new Error('Error retrieving users');
  }
}



//TRIPS
export async function saveTrip(trip: Trip) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(trip),
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export async function getTripById(id: string, table?: 'primary' | 'secondary') {
  if (!table) table = 'primary';
  const getParams = {
      TableName: table === 'primary' ? process.env.TABLE_NAME! : process.env.SECONDARY_TABLE_NAME!,
      Key: {id},
  }
  const response = await docClient.send(new GetCommand(getParams));
  if (!response.Item) throw new ResponseError(404, 'Trip not found');
  return response.Item;
}

export async function getAllTrips(props: {lastEvaluatedKey?: Record<string, any>, pageSize: number}) {
  const { lastEvaluatedKey, pageSize } = props;
  const queryParams: QueryCommandInput = {
      TableName: process.env.TABLE_NAME!,
      IndexName: 'dateSort',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {'#type': 'type'},
      //@ts-ignore
      ExpressionAttributeValues: {':type': '#TRIP'}, //TS wants: {':type': {S: '#TRIP'}} but the request breaks then
      ScanIndexForward: false,
      Limit: pageSize
  };
  if (lastEvaluatedKey) queryParams.ExclusiveStartKey = lastEvaluatedKey; //use the LastEvaluatedKey from the previous query
  const response = await docClient.send(new QueryCommand(queryParams));
  if (!response?.Items) throw new ResponseError(500, 'DB query failed');
  return {
    items: response.Items,
    lastEvaluatedKey: response.LastEvaluatedKey,  //include LastEvaluatedKey in the response
  };
}

export async function getTripsBySearchword(props: {searchword: string, pageSize?: number, lastEvaluatedKey?: Record<string, any>}) { //must be a scan :( bc Query does not support `contains`
  const scanParams: ScanCommandInput = {
    TableName: process.env.TABLE_NAME!,
    FilterExpression: "contains(#name_lower, :searchword) OR contains(#description_lower, :searchword) OR contains(#nickname_lower, :searchword) OR contains(#keyWords, :searchword)",
    ExpressionAttributeNames: {
      "#name_lower": "name_lower",
      "#description_lower": "description_lower",
      "#nickname_lower": "nickname_lower",
      "#keyWords": "keyWords"	
    },
    ExpressionAttributeValues: {
      ":searchword": props.searchword.toLowerCase(),
    },
    Limit: props.pageSize
  };
  if (props.lastEvaluatedKey) scanParams.ExclusiveStartKey = props.lastEvaluatedKey;
  const response = await docClient.send(new ScanCommand(scanParams));
  return {
    items: response.Items,
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

export async function getTripsByCreatedBy(email: string) {
  const queryParams: QueryCommandInput = {
    TableName: process.env.TABLE_NAME!,
    IndexName: 'createdBy',
    KeyConditionExpression: '#createdBy = :createdBy',
    ExpressionAttributeNames: {'#createdBy': 'createdBy'},
    //@ts-ignore
    ExpressionAttributeValues: {':createdBy': email}, //TS wants: {':type': {S: '#TRIP'}} but the request breaks then
    ScanIndexForward: false,
  };
  const response = await docClient.send(new QueryCommand(queryParams));
  if (!response?.Items) throw new ResponseError(500, 'DB query failed');
  return response.Items;
}


export async function updateTrip(trip: Trip) {
  const { id, name, departureTime, departureFrom, destination, description, category, keyWords, image, requirements, meetingLat, meetingLng, destinationLat, destinationLng } = trip;
  const updateParams: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME!,
    Key: { id },
    UpdateExpression: `
      set 
        #name = :name,
        #departureTime = :departureTime,
        #departureFrom = :departureFrom,
        #destination = :destination,
        #description = :description,
        #updatedAt = :updatedAt,
        #category = :category,
        #keyWords = :keyWords,
        #image = :image,
        #requirements = :requirements,
        #meetingLat = :meetingLat,
        #meetingLng = :meetingLng,
        #destinationLat = :destinationLat,
        #destinationLng = :destinationLng
    `,
    ExpressionAttributeNames: {
      '#name': 'name',
      '#departureTime': 'departureTime',
      '#departureFrom': 'departureFrom',
      '#destination': 'destination',
      '#description': 'description',
      '#updatedAt': 'updatedAt',
      '#category': 'category',
      '#keyWords': 'keyWords',
      '#image': 'image',
      '#requirements': 'requirements',
      '#meetingLat': 'meetingLat',
      '#meetingLng': 'meetingLng',
      '#destinationLat': 'destinationLat',
      '#destinationLng': 'destinationLng'
    },
    ExpressionAttributeValues: {
      ':name': name,
      ':departureTime': departureTime,
      ':departureFrom': departureFrom,
      ':destination': destination,
      ':description': description,
      ':updatedAt': new Date().toISOString(),
      ':category': category || '',
      ':keyWords': keyWords?.toLowerCase() || '',
      ':image': image,
      ':requirements': requirements || '',
      ':meetingLat': meetingLat,
      ':meetingLng': meetingLng,
      ':destinationLat': destinationLat,
      ':destinationLng': destinationLng
    },
    ReturnValues: 'ALL_NEW'
  };  
  const response = await docClient.send(new UpdateCommand(updateParams));
  if (!response?.Attributes) throw new ResponseError(500, 'Update failed');
  return response.Attributes;
}

export async function deleteTrip(id: string) {
  const deleteParams: DeleteCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id}
  }
  const response = await docClient.send(new DeleteCommand(deleteParams));
  return response;
}

export async function batchGetTrips(ids: string[]) {
  if (ids.length === 0) return [];
  const batchGetParams: BatchGetItemCommandInput = {
    RequestItems: {
      [process.env.TABLE_NAME!]: {
        Keys: ids.map(id => marshall({ id }))
      }
    }
  };
  const response = await docClient.send(new BatchGetItemCommand(batchGetParams));
  if (!response.Responses) throw new Error('Trips not found');
  return response.Responses[process.env.TABLE_NAME!].map(item => unmarshall(item));
}



//FAVORITE TRIPS
export async function getFavoriteTripsByEmail(email: string) {
  try {
    const getParams = {
      TableName: process.env.TABLE_NAME!,
      Key: {email}
    };
    const response = await docClient.send(new GetCommand(getParams));
    return response.Item || [];
  } catch (error) {
    console.error("Error getting favorite trips:", error);
    throw new Error("Failed to get favorite trips");
  }
}

export async function saveFavoriteTrips(favoriteTrips: FavoriteTrips) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(favoriteTrips)
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}



//COMMENTS (trip comments)
export async function saveComment(comment: Comment) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(comment),
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export async function getCommentById(id: string, table?: 'primary' | 'secondary') {
  if (!table) table = 'primary';
  const getParams = {
      TableName: table === 'primary' ? process.env.TABLE_NAME! : process.env.SECONDARY_TABLE_NAME!,
      Key: {id},
  }
  const response = await docClient.send(new GetCommand(getParams));
  if (!response.Item) throw new ResponseError(404, 'Comment not found');
  return response.Item;
}

export async function getComments(props: {lastEvaluatedKey?: Record<string, any>, pageSize: number, tripId: string}) {
  const { lastEvaluatedKey, pageSize, tripId } = props;
  const queryParams: QueryCommandInput = {
      TableName: process.env.TABLE_NAME!,
      IndexName: 'trip',
      KeyConditionExpression: '#trip = :trip',
      ExpressionAttributeNames: {'#trip': 'trip'},
      //@ts-ignore
      ExpressionAttributeValues: {':trip': tripId}, //TS wants: {':type': {S: '#COMMENT'}} but the request breaks then
      ScanIndexForward: false,
      Limit: pageSize
  };
  if (lastEvaluatedKey) queryParams.ExclusiveStartKey = lastEvaluatedKey; //use the LastEvaluatedKey from the previous query
  const response = await docClient.send(new QueryCommand(queryParams));
  if (!response?.Items) throw new ResponseError(500, 'DB query failed');
  return {
    items: response.Items,
    lastEvaluatedKey: response.LastEvaluatedKey,  //include LastEvaluatedKey in the response
  };
}

export async function deleteComment(id: string) {
  const deleteParams: DeleteCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id}
  }
  const response = await docClient.send(new DeleteCommand(deleteParams));
  return response;
}



//GROUPS
export async function saveGroup(group: Group) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(group), 
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export async function getGroupById(id: string) {
  const getParams = {
      TableName: process.env.TABLE_NAME!,
      Key: {id},
  }
  const response = await docClient.send(new GetCommand(getParams));
  if (!response.Item) throw new ResponseError(404, 'Group not found');
  return response.Item;
}

export async function getGroupsByEmail(email: string): Promise<Group[]> {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME!,
    IndexName: 'createdBy',
    KeyConditionExpression: '#createdBy = :email',
    ExpressionAttributeNames: {'#createdBy': 'createdBy'},
    //@ts-ignore
    ExpressionAttributeValues: {':email': email},
  };
  try {
    const response = await docClient.send(new QueryCommand(params));
    if (!response.Items) { return []; }
    return response.Items as Group[];
  } catch (error) {
    console.error("Error fetching groups by email:", error);
    throw new Error("Could not fetch groups");
  }
}

export async function deleteGroup(id: string) {
  const deleteParams: DeleteCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id}
  }
  const response = await docClient.send(new DeleteCommand(deleteParams));
  return response;
}

export async function updateGroup(id: string, name: string) {
  const updateParams: UpdateCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id},
      UpdateExpression: 'set #name = :name, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {'#name': 'name', '#updatedAt': 'updatedAt'},
      ExpressionAttributeValues: {':name': name, ':updatedAt': new Date().toISOString()},
      ReturnValues: 'ALL_NEW'
  };
  const response = await docClient.send(new UpdateCommand(updateParams));
  if (!response?.Attributes) throw new ResponseError(500, 'Update failed');
  return response.Attributes;
}



//CONNECTIONS
export const saveConnection = async (connectionId: string, groupId: string): Promise<PutCommandOutput> => {
  try {
    const params = {TableName: process.env.TABLE_NAME, Item: {id: connectionId, groupId: groupId}}
    const command = new PutCommand(params);
    const res = await docClient.send(command);
    return res;
  } catch (error) {
    console.error('Error saving connection:', error);
    throw error;
  }
};

export const getGroupConnections = async (groupId: string): Promise<string[]> => {
  try {
    const params = {
      TableName: process.env.TABLE_NAME,
      IndexName: 'groupIdIndex',
      KeyConditionExpression: '#groupId = :groupId',
      ExpressionAttributeNames: {'#groupId': 'groupId'},
      ExpressionAttributeValues: {':groupId': groupId},
      ProjectionExpression: 'id' // only get the connection ids
    };
    const command = new QueryCommand(params);
    const result = await docClient.send(command);
    const connections = result.Items?.map(item => item.id) || [];
    return connections;
  } catch (error) {
    console.error('Error fetching group connections:', error);
    throw error;
  }
};

export const deleteConnection = async (connectionId: string): Promise<DeleteCommandOutput> => {
  try {
    const params = {TableName: process.env.TABLE_NAME, Key: {id: connectionId}}
    const command = new DeleteCommand(params);
    const res = await docClient.send(command);
    return res;
  } catch (error) {
    console.error('Error deleting connection:', error);
    throw error;
  }
};



//POSTS (group chats)
export async function savePost(props: {post: Post, table?: 'primary' | 'secondary'}) {
  let { post, table } = props;
  if (!table) table = 'primary';
  const putParams: PutItemCommandInput = {
      TableName: table === 'primary' ? process.env.TABLE_NAME! : process.env.SECONDARY_TABLE_NAME!, 
      Item: marshall(post), 
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export const getPostsByGroupId = async (props: {groupId: string; table?: 'primary' | 'secondary'}): Promise<Post[]> => {
  let { groupId, table } = props;
  if (!table) table = 'primary';
  const params = {
    TableName: table === 'primary' ? process.env.TABLE_NAME! : process.env.SECONDARY_TABLE_NAME!,
    IndexName: 'groupIdIndex',
    KeyConditionExpression: '#groupId = :groupId',
    ExpressionAttributeNames: {'#groupId': 'groupId'},
    ExpressionAttributeValues: {':groupId': groupId},
    ScanIndexForward: false, //get the most recent posts first
  };
  try {
    const data = await docClient.send(new QueryCommand(params));
    return data.Items as Post[];
  } catch (err) {
    console.error('Error retrieving posts:', err);
    throw new Error('Error retrieving posts');
  }
};