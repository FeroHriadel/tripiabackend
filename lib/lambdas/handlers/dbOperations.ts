import { DynamoDB, PutItemCommand, PutItemCommandInput, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient, GetCommand, UpdateCommand, UpdateCommandInput, DeleteCommand, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Category, Trip } from "../../../types";
import { ResponseError } from './ResponseError';
import * as dotenv from 'dotenv';
import { log } from "./utils";
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



//TRIPS
export async function saveTrip(trip: Trip) {
  const putParams: PutItemCommandInput = {
      TableName: process.env.TABLE_NAME!, 
      Item: marshall(trip),
  };
  const response = await docClient.send(new PutItemCommand(putParams));
  return response;
}

export async function getTripById(id: string) {
  const getParams = {
      TableName: process.env.TABLE_NAME!,
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


export async function updateTrip(trip: Trip) {
  const { id, name, departureTime, departureFrom, destination, description } = trip;
  const updateParams: UpdateCommandInput = {
      TableName: process.env.TABLE_NAME!,
      Key: {id},
      UpdateExpression: `
        set 
          #name = :name,
          #departureTime = :departureTime,
          #departureFrom = :departureFrom,
          #destination = :destination,
          #description = :description,
          #updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        '#name': 'name',
        '#departureTime': 'departureTime',
        '#departureFrom': 'departureFrom',
        '#destination': 'destination',
        '#description': 'description',
        '#updatedAt': 'updatedAt'

      },
      ExpressionAttributeValues: {
        ':name': name,
        ':departureTime': departureTime,
        ':departureFrom': departureFrom,
        ':destination': destination,
        ':description': description,
        ':updatedAt': new Date().toISOString()
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