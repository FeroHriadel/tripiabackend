import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BatchWriteItemCommandInput, DynamoDB, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ResponseError } from "../ResponseError";
import { Comment } from "../../../../types";
import { log, res, structureImagesToDeleteForEventBus } from "../utils";




/************************************************************************************
this is a fairly complicated stuff - I keep in all in one file for easier reference 
************************************************************************************/



// DB CLIENT & EVENT BRIDGE CLIENT
const client = new DynamoDB({region: process.env.REGION});
const docClient = DynamoDBDocumentClient.from(client);
const eventBridgeClient = new EventBridgeClient({region: process.env.REGION});



//VALUES
const batchSize = 25; // dynamoDB allows max 25 items per batch write



// HELPERS
export async function getComments(tripId: string) {
  const queryParams: QueryCommandInput = {
      TableName: process.env.TABLE_NAME!,
      IndexName: 'trip',
      KeyConditionExpression: '#trip = :trip',
      ExpressionAttributeNames: {'#trip': 'trip'},
      //@ts-ignore
      ExpressionAttributeValues: {':trip': tripId}, //TS wants: {':type': {S: '#COMMENT'}} but the request breaks then
  };
  const response = await docClient.send(new QueryCommand(queryParams));
  if (!response?.Items) throw new ResponseError(500, 'DB query failed');
  //@ts-ignore
  return response.Items as Comment[];
}


function getCommentsImages(comments: Comment[]): string[] {
  return comments
    .filter(comment => comment.image !== '')
    .map(comment => comment.image);
}

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
  log('Event bus params: ', params);
  return params;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return array.reduce((chunks: T[][], item: T, index: number) => {
    const chunkIndex = Math.floor(index / size);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = []; // start a new chunk
    }
    chunks[chunkIndex].push(item);
    return chunks;
  }, []);
}

async function batchDeleteCommentsByIds(commentIds: string[]) {
  let deletedCount = 0;
  const chunks = chunkArray(commentIds, batchSize);
  for (const chunk of chunks) { 
    const deleteRequests = chunk.map(id => ({ DeleteRequest: {Key: {id}}}));
    //@ts-ignore
    const batchWriteParams: BatchWriteItemCommandInput = { RequestItems: {[process.env.TABLE_NAME!]: deleteRequests}};
    const response = await docClient.send(new BatchWriteCommand(batchWriteParams));
    if (response.UnprocessedItems && response.UnprocessedItems[process.env.TABLE_NAME!]?.length > 0) {
      console.warn('Some items were not processed:', response.UnprocessedItems);
    }
    deletedCount += chunk.length;
  }
  return {message: `${deletedCount}/${commentIds.length} comments deleted.`, ok: true};
}



// LAMBDA HANDLER
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    //get tripId
      log('Event is: ', event);
      const tripId: string = (event as any).detail?.tripId;
      if (!tripId) throw new ResponseError(400, 'Got no tripId');
      log('Will be deleting comments for trip: ', tripId);
    
      //get comments
      const comments = await getComments(tripId);
      log('Found comments: ', comments);
      if (!comments) throw new ResponseError(500, 'DB query failed');
      if (comments.length === 0) return res(200, {message: 'No comments to delete'});

      //delete comments
      const response = await batchDeleteCommentsByIds(comments.map(comment => comment.id));
      if (!response.ok) throw new ResponseError(500, response?.message || 'Batch delete comments went wrong');
      log('Batch delete comments response: ', response);

      //delete images
      const commentsImages = getCommentsImages(comments);
      const deleteImagesParams = getPutEventParams(commentsImages);
      const eventBusRes = await eventBridgeClient.send(new PutEventsCommand(deleteImagesParams));
      log('deleteImagesEventBus response: ', eventBusRes);

      return res(200, {message: response.message});

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



