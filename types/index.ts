import { Table } from "aws-cdk-lib/aws-dynamodb"
import { EventBus } from "aws-cdk-lib/aws-events";
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
  tripBatchGet?: NodejsFunction;
  getImageUploadLink?: NodejsFunction;
  deleteImages?: NodejsFunction;
  userUpdate?: NodejsFunction;
  userGet?: NodejsFunction;
  userBatchGet?: NodejsFunction;
  cognitoPostSignup?: NodejsFunction;
  favoriteTripsGet?: NodejsFunction;
  favoriteTripsSet?: NodejsFunction;
  commentCreate?: NodejsFunction;
  commentGet?: NodejsFunction;
  commentDelete?: NodejsFunction;
  commentBatchDelete?: NodejsFunction;
  groupCreate?: NodejsFunction;
  groupGet?: NodejsFunction;
  groupUpdate?: NodejsFunction;
  groupDelete?: NodejsFunction;
}

export interface WsLambdas {
  connectLambda?: NodejsFunction;
  disconnectLambda?: NodejsFunction;
  defaultLambda?: NodejsFunction;
  postCreate?: NodejsFunction;
  postGet?: NodejsFunction;
  postDelete?: NodejsFunction;
}

export interface AppTables {
  categoriesTable: Table;
  tripsTable: Table;
  usersTable: Table;
  favoriteTripsTable: Table;
  commentsTable: Table;
  groupsTable: Table;
  connectionsTable: Table;
  postsTable: Table;
}

export interface AppBuckets {
  imagesBucket: Bucket;
}

export interface AppPolicyStatemens {
  imagesBucketAccessStatement: PolicyStatement;
}

export interface EventBusData {
  source: string[];
  detailType: string[];
  busName: string;
  ruleName: string;
}

export interface AppEventBuses {
  deleteImagesEventBus: EventBus;
  batchDeleteCommentsEventBus: EventBus;
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
  departureDate: string;
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
  category?: string;
  keyWords?: string;
  image?: string;
  requirements?: string;
  meetingLat?: number | null | undefined;
  meetingLng?: number | null | undefined;
  destinationLat?: number | null | undefined;
  destinationLng?: number | null | undefined;
}

export interface User {
  email: string;
  nickname: string;
  nickname_lower?: string;
  profilePicture: string;
  about: string;
  createdAt: string;
  updatedAt: string;
  type: '#USER';
}

export interface FavoriteTrips {
  email: string;
  tripIds: string[];
  updatedAt: string;
  type: '#FAVORITE_TRIPS';
}

export interface Comment {
  id: string;
  by: string;
  body: string;
  image: string;
  trip: string;
  createdAt: string;
  type: '#COMMENT'
}

export interface Group {
  id: string;
  createdBy: string;
  members: string[];
  name: string;
  createdAt: string;
  updatedAt: string;
  type: '#GROUP';
}

export interface Post {
  id: string;
  groupId: string;
  createdAt: string;
  postedBy: string;
  body: string;
  images: string[];
  type: '#POST';
}