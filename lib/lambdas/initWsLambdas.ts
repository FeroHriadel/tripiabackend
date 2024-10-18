import { App, Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AppLambda } from "./AppLambda";
import { AppBuckets, AppPolicyStatemens, AppTables, WsLambdas } from "../../types";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { imagesBucketAccessTag, deleteImagesBusDetailType, deleteImagesBusSource, deleteImagesEventBusName, deleteImagesEventBusRuleName, batchDeleteCommentsBusDetailType, batchDeleteCommentsBusSource, batchDeleteCommentsEventBusName, batchDeleteCommentsEventBusRuleName } from "../../utils/resourceValues";
import * as dotenv from 'dotenv';
import { Bucket } from "aws-cdk-lib/aws-s3";
dotenv.config();



/***************************************************************************************************************************
  - At the time of wsLambdas initialization (when `initializeWsLambdas()` is called in tripai-stack.ts)
    there's no WEBSOCKET_API_ENDPOINT environemnt variable value and no ws-related policy. But:
  - Feel free to use the WEBSOCKET_API_ENDPOINT in their handlers, though => it will be added later by AppWsGateway
  - WS related Policies will also be added later by AppWsGateway
****************************************************************************************************************************/



interface InitLambdasProps {
  tables: AppTables;
  buckets: AppBuckets;
  policyStatements: AppPolicyStatemens;
}

interface InitConnectionLambdasProps {
  connectionsTable: Table;
}

interface InitPostsLambdaProps {
  connectionsTable: Table;
  postsTable: Table;
}



const wsLambdas: WsLambdas = {}



function initWsAuthLambda(stack: Stack) {
  wsLambdas.wsAuthLambda = new AppLambda(stack, {
    lambdaName: 'wsAuth',
    folder: 'ws',
  }).lambda;
}


function initConnectionLambdas(stack: Stack, props: InitConnectionLambdasProps) {
  const { connectionsTable } = props;
  wsLambdas.connectLambda = new AppLambda(stack, {
    lambdaName: 'connect', 
    folder: 'ws', 
    table: connectionsTable, 
    tableWriteRights: true
  }).lambda;
  wsLambdas.disconnectLambda = new AppLambda(stack, {
    lambdaName: 'disconnect',
    folder: 'ws',
    table: connectionsTable,
    tableWriteRights: true
  }).lambda;
  wsLambdas.defaultLambda = new AppLambda(stack, {
    lambdaName: 'default',
    folder: 'ws',
  }).lambda;
}

function initPostsLambdas(stack: Stack, props: InitPostsLambdaProps) {
  const { connectionsTable, postsTable } = props;
  wsLambdas.postCreate = new AppLambda(stack, {
    lambdaName: 'postCreate',
    folder: 'ws',
    table: connectionsTable,
    secondaryTable: postsTable,
    secondaryTableWriteRights: true,
  }).lambda;
  wsLambdas.postGet = new AppLambda(stack, {
    lambdaName: 'postGet',
    folder: 'ws',
    table: postsTable,
    tableWriteRights: true,
  }).lambda;
  wsLambdas.postDelete = new AppLambda(stack, {
    lambdaName: 'postDelete',
    folder: 'ws',
    table: connectionsTable,
    secondaryTable: postsTable,
    secondaryTableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
}



export function initWsLambdas(stack: Stack, props: InitLambdasProps) {
  const { tables } = props;
  initConnectionLambdas(stack, { connectionsTable: tables.connectionsTable });
  initPostsLambdas(stack, { connectionsTable: tables.connectionsTable, postsTable: tables.postsTable });
  initWsAuthLambda(stack);
  return wsLambdas;
}