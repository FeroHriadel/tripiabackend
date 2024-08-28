import { Table } from "aws-cdk-lib/aws-dynamodb"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';


export interface AppLambdas {
  categoryCreate?: NodejsFunction;
  categoryGet?: NodejsFunction;
  categoryUpdate?: NodejsFunction;
  categoryDelete?: NodejsFunction;
  tripCreate?: NodejsFunction;
  tripGet?: NodejsFunction;
  tripUpdate?: NodejsFunction;
  tripDelete?: NodejsFunction;
}

export interface AppTables {
  categoriesTable: Table;
  tripsTable: Table;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  type: "#CATEGORY";
}

export interface Trip {
  id: string;
  name: string;
  departureTime: string;
  departureFrom: string;
  destination: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  type: '#TRIP';
}