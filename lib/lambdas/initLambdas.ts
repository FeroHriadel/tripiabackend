import { Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AppLambda } from "./AppLambda";
import { AppLambdas, AppTables } from "../../types";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dotenv from 'dotenv';
dotenv.config();



interface InitCategoriesLambdasProps {
    table: Table;
}

interface InitTripLambdasProps {
  table: Table;
}

interface InitLambdasProps {
  tables: AppTables;
}



const appLambdas: AppLambdas = {}; //list of all lambdas after init



function initCategoryLambdas(stack: Stack, props: InitCategoriesLambdasProps) {
  const { table } = props;
  appLambdas.categoryCreate = new AppLambda(stack, {lambdaName: 'categoryCreate', folder: 'categories', table, tableWriteRights: true}).lambda;
  appLambdas.categoryGet = new AppLambda(stack, {lambdaName: 'categoryGet', folder: 'categories', table}).lambda;
  appLambdas.categoryUpdate = new AppLambda(stack, {lambdaName: 'categoryUpdate', folder: 'categories', table, tableWriteRights: true}).lambda;
  appLambdas.categoryDelete = new AppLambda(stack, {lambdaName: 'categoryDelete', folder: 'categories', table, tableWriteRights: true}).lambda;
}

function initTripLambdas(stack: Stack, props: InitTripLambdasProps) {
  const { table } = props;
  appLambdas.tripCreate = new AppLambda(stack, {lambdaName: 'tripCreate', folder: 'trips', table, tableWriteRights: true}).lambda;
}

export function initLambdas(stack: Stack, props: InitLambdasProps) {
  const { tables } = props;
  initCategoryLambdas(stack, {table: tables.categoriesTable});
  initTripLambdas(stack, {table: tables.tripsTable});
  return appLambdas;
}