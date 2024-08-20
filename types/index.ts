import { Table } from "aws-cdk-lib/aws-dynamodb"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';



export interface AppTables {
  categoriesTable: Table;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  type: "#CATEGORY";
}

export interface AppLambdas {
  categoryCreate?: NodejsFunction;
  categoryGet?: NodejsFunction;
  categoryUpdate?: NodejsFunction;
  categoryDelete?: NodejsFunction;
}