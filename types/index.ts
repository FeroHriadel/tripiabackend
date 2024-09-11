import { Table } from "aws-cdk-lib/aws-dynamodb"
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";



export interface AppLambdas {
  categoryCreate?: NodejsFunction;
  categoryGet?: NodejsFunction;
  categoryUpdate?: NodejsFunction;
  categoryDelete?: NodejsFunction;
  tripCreate?: NodejsFunction;
  tripGet?: NodejsFunction;
  tripUpdate?: NodejsFunction;
  tripDelete?: NodejsFunction;
  getImageUploadLink?: NodejsFunction;
  userUpdate?: NodejsFunction;
  cognitoPostSignup?: NodejsFunction;
}

export interface AppTables {
  categoriesTable: Table;
  tripsTable: Table;
  usersTable: Table;
}

export interface AppBuckets {
  imagesBucket: Bucket;
}

export interface AppPolicyStatemens {
  imagesBucketAccessStatement: PolicyStatement;
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
  name_lower?: string; //so we can search case insensitive
  departureTime: string;
  departureFrom: string;
  destination: string;
  description: string;
  description_lower?: string; //so we can search case insensitive
  createdBy: string;
  nickname: string;
  nickname_lower: string; //so we can search by user's nickname & case insensitive. Because dynamoDB is a retarded database we'll have to overwrite all Trips created by user if user should decide to update their nickname. This is the last time I have used dynamoDB as God is above me. How did such a DB even catch on?
  createdAt: string;
  updatedAt: string;
  type: '#TRIP';
}

export interface User {
  email: string;
  nickname: string;
  nickname_lower?: string;
  profilePicture: string;
  createdAt: string;
  updatedAt: string;
  type: '#USER';
}