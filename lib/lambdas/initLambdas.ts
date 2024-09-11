import { App, Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AppLambda } from "./AppLambda";
import { AppBuckets, AppLambdas, AppPolicyStatemens, AppTables } from "../../types";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { imagesBucketAccessTag } from "../../utils/resourceValues";
import * as dotenv from 'dotenv';
dotenv.config();



interface InitCategoriesLambdasProps {
    table: Table;
}

interface InitTripLambdasProps {
  tripsTable: Table;
  usersTable: Table;
}

interface InitUserLambdasProps {
  usersTable: Table;
}

interface InitNonApiLambdasProps {
  tables: AppTables;
}

interface createBucketLambdasProps {
  buckets: AppBuckets;
  policyStatements: AppPolicyStatemens;
}

interface InitLambdasProps {
  tables: AppTables;
  buckets: AppBuckets;
  policyStatements: AppPolicyStatemens;
}





const appLambdas: AppLambdas = {}; //list of all lambdas after init



function initCategoryLambdas(stack: Stack, props: InitCategoriesLambdasProps) {
  const { table } = props;
  appLambdas.categoryCreate = new AppLambda(stack, {
    lambdaName: 'categoryCreate', 
    folder: 'categories', 
    table, 
    tableWriteRights: true
  }).lambda;
  appLambdas.categoryGet = new AppLambda(stack, {
    lambdaName: 'categoryGet', 
    folder: 'categories', 
    table}).lambda;
  appLambdas.categoryUpdate = new AppLambda(stack, {
    lambdaName: 'categoryUpdate', 
    folder: 'categories', 
    table, 
    tableWriteRights: true
  }).lambda;
  appLambdas.categoryDelete = new AppLambda(stack, {
    lambdaName: 'categoryDelete', 
    folder: 'categories', 
    table, 
    tableWriteRights: true
  }).lambda;
}

function initTripLambdas(stack: Stack, props: InitTripLambdasProps) {
  const { tripsTable, usersTable } = props;
  appLambdas.tripCreate = new AppLambda(stack, {
    lambdaName: 'tripCreate', 
    folder: 'trips', 
    table: tripsTable, 
    tableWriteRights: true, 
    secondaryTable: usersTable
  }).lambda;
  appLambdas.tripGet = new AppLambda(stack, {
    lambdaName: 'tripGet', 
    folder: 'trips', 
    table: tripsTable
  }).lambda;
  appLambdas.tripUpdate = new AppLambda(stack, {
    lambdaName: 'tripUpdate', 
    folder: 'trips', 
    table: tripsTable, 
    tableWriteRights: true
  }).lambda;
  appLambdas.tripDelete = new AppLambda(stack, {
    lambdaName: 'tripDelete', 
    folder: 'trips', 
    table: tripsTable, 
    tableWriteRights: true
  }).lambda;
}

function initUserLambdas(stack: Stack, props: InitUserLambdasProps) {
  const { usersTable } = props;
  appLambdas.userUpdate = new AppLambda(stack, {
    lambdaName: 'userUpdate', 
    folder: 'users', 
    table: usersTable, 
    tableWriteRights: true, 
    tags: {imagesBucketAccessTag: imagesBucketAccessTag}
  }).lambda;
}

function initBucketLambdas(stack: Stack, props: createBucketLambdasProps) {
  const { buckets, policyStatements } = props; 
  appLambdas.getImageUploadLink = new AppLambda(stack, {
    lambdaName: 'getImageUploadLink',
    folder: 'buckets',
    bucket: buckets.imagesBucket,
    policyStatements: {imagesBucketAccessStatement: policyStatements.imagesBucketAccessStatement}
  }).lambda;
}

function initNonApiLambdas(stack: Stack, props: InitNonApiLambdasProps) {
  const { tables } = props;  const { usersTable } = tables;
  appLambdas.cognitoPostSignup = new AppLambda(stack, {
    lambdaName: 'cognitoPostSignup', 
    folder: 'cognito',  
    table: usersTable, 
    tableWriteRights: true
  }).lambda;
}

export function initLambdas(stack: Stack, props: InitLambdasProps) {
  const { tables, buckets, policyStatements } = props;
  initCategoryLambdas(stack, {table: tables.categoriesTable});
  initTripLambdas(stack, {tripsTable: tables.tripsTable, usersTable: tables.usersTable});
  initUserLambdas(stack, {usersTable: tables.usersTable});
  initBucketLambdas(stack, {buckets, policyStatements});
  initNonApiLambdas(stack, props);
  return appLambdas;
}