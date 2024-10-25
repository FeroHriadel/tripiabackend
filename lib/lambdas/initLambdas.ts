import { App, Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AppLambda } from "./AppLambda";
import { AppBuckets, AppLambdas, AppPolicyStatemens, AppTables, WsLambdas } from "../../types";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { imagesBucketAccessTag, deleteImagesBusDetailType, deleteImagesBusSource, deleteImagesEventBusName, deleteImagesEventBusRuleName, batchDeleteCommentsBusDetailType, batchDeleteCommentsBusSource, batchDeleteCommentsEventBusName, batchDeleteCommentsEventBusRuleName, updateUserGroupsBusDetailType, updateUserGroupsBusSource, updateUserGroupsEventBusName, updateUserGroupsEventBusRuleName, batchDeletePostsBusDetailType, batchDeletePostsBusSource, batchDeletePostsEventBusName, batchDeletePostsEventBusRuleName } from "../../utils/resourceValues";
import * as dotenv from 'dotenv';
import { InvitationsTable } from "../tables/InvitationsTable";
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

interface createBucketLambdasProps {
  buckets: AppBuckets;
  policyStatements: AppPolicyStatemens;
}

interface InitLambdasProps {
  tables: AppTables;
  buckets: AppBuckets;
  policyStatements: AppPolicyStatemens;
}

interface InitFavoriteTripsLambdasProps {
  favoriteTripsTable: Table;
}

interface InitCommentsLambdasProps {
  commentsTable: Table;
  tripsTable: Table;
}

interface InitGroupsLambdasProps {
  groupsTable: Table;
  invitationsTable: Table;
}

interface InitInvitationsLambdasProps {
  invitationsTable: Table;
  groupsTable: Table;
}

interface InitPostsLambdasProps {
  postsTable: Table;
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
    tableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
  appLambdas.tripDelete = new AppLambda(stack, {
    lambdaName: 'tripDelete', 
    folder: 'trips', 
    table: tripsTable, 
    tableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    },
    secondaryEventBusData: {
      detailType: batchDeletePostsBusDetailType, 
      source: batchDeletePostsBusSource, 
      busName: batchDeletePostsEventBusName, 
      ruleName: batchDeletePostsEventBusRuleName
    },
  }).lambda;
  appLambdas.tripBatchGet = new AppLambda(stack, {
    lambdaName: 'tripBatchGet',
    folder: 'trips',
    table: tripsTable
  }).lambda;
}

function initImagesLambdas(stack: Stack, props: createBucketLambdasProps) {
  const { buckets, policyStatements } = props; 
  appLambdas.getImageUploadLink = new AppLambda(stack, {
    lambdaName: 'getImageUploadLink',
    folder: 'images',
    bucket: buckets.imagesBucket,
    policyStatements: {imagesBucketAccessStatement: policyStatements.imagesBucketAccessStatement}
  }).lambda;
  appLambdas.deleteImages = new AppLambda(stack, {
    lambdaName: 'deleteImages',
    folder: 'images',
    bucket: buckets.imagesBucket,
    policyStatements: {imagesBucketAccessStatement: policyStatements.imagesBucketAccessStatement},
    tags: {imagesBucketAccessTag: imagesBucketAccessTag}
  }).lambda;
}

function initUserLambdas(stack: Stack, props: InitUserLambdasProps) {
  const { usersTable } = props;
  appLambdas.userGet = new AppLambda(stack, {
    lambdaName: 'userGet',
    folder: 'users',
    table: usersTable,
  }).lambda;
  appLambdas.userUpdate = new AppLambda(stack, {
    lambdaName: 'userUpdate', 
    folder: 'users', 
    table: usersTable, 
    tableWriteRights: true, 
    tags: {imagesBucketAccessTag: imagesBucketAccessTag},
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
  appLambdas.cognitoPostSignup = new AppLambda(stack, {
    lambdaName: 'cognitoPostSignup', 
    folder: 'users',  
    table: usersTable, 
    tableWriteRights: true,
  }).lambda;
  appLambdas.userBatchGet = new AppLambda(stack, {
    lambdaName: 'userBatchGet',
    folder: 'users',
    table: usersTable
  }).lambda;
  appLambdas.userUpdateGroups = new AppLambda(stack, {
    lambdaName: 'userUpdateGroups',
    folder: 'users',
    table: usersTable,
    tableWriteRights: true,
  }).lambda;
}

function initFavoriteTripsLambdas(stack: Stack, props: InitFavoriteTripsLambdasProps) {
  const { favoriteTripsTable } = props;
  appLambdas.favoriteTripsGet = new AppLambda(stack, {
    lambdaName: 'favoriteTripsGet',
    folder: 'favoriteTrips',
    table: favoriteTripsTable
  }).lambda;
  appLambdas.favoriteTripsSet = new AppLambda(stack, {
    lambdaName: 'favoriteTripsSet',
    folder: 'favoriteTrips',
    table: favoriteTripsTable,
    tableWriteRights: true
  }).lambda;	
}

function initCommentLambdas(stack: Stack, props: InitCommentsLambdasProps) {
  const { commentsTable, tripsTable } = props;
  appLambdas.commentCreate = new AppLambda(stack, {
    lambdaName: 'commentCreate',
    folder: 'comments',
    table: commentsTable,
    secondaryTable: tripsTable,
    tableWriteRights: true
  }).lambda;
  appLambdas.commentGet = new AppLambda(stack, {
    lambdaName: 'commentGet',
    folder: 'comments',
    table: commentsTable
  }).lambda;
  appLambdas.commentDelete = new AppLambda(stack, {
    lambdaName: 'commentDelete',
    folder: 'comments',
    table: commentsTable,
    tableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
  appLambdas.commentBatchDelete = new AppLambda(stack, {
    lambdaName: 'commentBatchDelete',
    folder: 'comments',
    table: commentsTable,
    tableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
}

function initGroupLambdas(stack: Stack, props: InitGroupsLambdasProps) {
  const { groupsTable, invitationsTable } = props;
  appLambdas.groupCreate = new AppLambda(stack, {
    lambdaName: 'groupCreate',
    folder: 'groups',
    table: groupsTable,
    tableWriteRights: true,
    eventBusData: {
      detailType: updateUserGroupsBusDetailType,
      source: updateUserGroupsBusSource,
      busName: updateUserGroupsEventBusName,
      ruleName: updateUserGroupsEventBusRuleName
    }
  }).lambda;
  appLambdas.groupGet = new AppLambda(stack, {
    lambdaName: 'groupGet',
    folder: 'groups',
    table: groupsTable
  }).lambda;
  appLambdas.groupDelete = new AppLambda(stack, {
    lambdaName: 'groupDelete',
    folder: 'groups',
    table: groupsTable,
    tableWriteRights: true,
    eventBusData: {
      detailType: updateUserGroupsBusDetailType,
      source: updateUserGroupsBusSource,
      busName: updateUserGroupsEventBusName,
      ruleName: updateUserGroupsEventBusRuleName
    },
    secondaryEventBusData: {
      detailType: batchDeletePostsBusDetailType,
      source: batchDeletePostsBusSource,
      busName: batchDeletePostsEventBusName,
      ruleName: batchDeletePostsEventBusRuleName
    }
  }).lambda;
  appLambdas.groupUpdate = new AppLambda(stack, {
    lambdaName: 'groupUpdate',
    folder: 'groups',
    table: groupsTable,
    tableWriteRights: true,
    secondaryTable: invitationsTable,
    secondaryTableWriteRights: true,
    eventBusData: {
      detailType: updateUserGroupsBusDetailType,
      source: updateUserGroupsBusSource,
      busName: updateUserGroupsEventBusName,
      ruleName: updateUserGroupsEventBusRuleName
    }
  }).lambda;
  appLambdas.groupBatchGet = new AppLambda(stack, {
    lambdaName: 'groupBatchGet',
    folder: 'groups',
    table: groupsTable,
  }).lambda;
}

function initInvitationLambdas(stack: Stack, props: InitInvitationsLambdasProps) {
  const{ invitationsTable, groupsTable } = props;
  appLambdas.invitationCreate = new AppLambda(stack, {
    lambdaName: 'invitationCreate',
    folder: 'invitations',
    table: invitationsTable,
    tableWriteRights: true,
    secondaryTable: groupsTable
  }).lambda;
  appLambdas.invitationGet = new AppLambda(stack, {
    lambdaName: 'invitationGet',
    folder: 'invitations',
    table: invitationsTable
  }).lambda;
  appLambdas.invitationDelete = new AppLambda(stack, {
    lambdaName: 'invitationDelete',
    folder: 'invitations',
    table: invitationsTable,
    tableWriteRights: true,
  }).lambda;
}

function initPostLambdas(stack: Stack, props: InitPostsLambdasProps) {
  appLambdas.postBatchDelete = new AppLambda(stack, {
    lambdaName: 'postBatchDelete',
    folder: 'posts',
    table: props.postsTable,
    tableWriteRights: true,
    eventBusData: {
      detailType: deleteImagesBusDetailType, 
      source: deleteImagesBusSource, 
      busName: deleteImagesEventBusName, 
      ruleName: deleteImagesEventBusRuleName
    }
  }).lambda;
}



export function initLambdas(stack: Stack, props: InitLambdasProps) {
  const { tables, buckets, policyStatements } = props;
  initCategoryLambdas(stack, {table: tables.categoriesTable});
  initTripLambdas(stack, {tripsTable: tables.tripsTable, usersTable: tables.usersTable});
  initImagesLambdas(stack, {buckets, policyStatements});
  initUserLambdas(stack, {usersTable: tables.usersTable});
  initFavoriteTripsLambdas(stack, {favoriteTripsTable: tables.favoriteTripsTable});
  initCommentLambdas(stack, {commentsTable: tables.commentsTable, tripsTable: tables.tripsTable});
  initGroupLambdas(stack, {groupsTable: tables.groupsTable, invitationsTable: tables.invitationsTable });
  initInvitationLambdas(stack, {invitationsTable: tables.invitationsTable, groupsTable: tables.groupsTable});
  initPostLambdas(stack, {postsTable: tables.postsTable});
  return appLambdas;
}