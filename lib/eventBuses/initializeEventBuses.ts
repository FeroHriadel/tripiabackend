import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DeleteImagesEventBus } from "./DeleteImagesEventBus";
import { BatchDeleteCommentsEventBus } from "./BatchDeleteCommentsEventBus";
import { UpdateUserGroupsEventBus } from "./UpdateUserGroupsEventBus";
import { BatchDeletePostsEventBus } from "./BatchDeletePostsEventBus";
import { Stack } from "aws-cdk-lib";
import { AppEventBuses } from "../../types";



interface InitializeEventBusesProps {
    deleteImagesEventBusPublisherFns: NodejsFunction[];
    deleteImagesEventBusTargetFn: NodejsFunction;
    batchDeleteCommentsEventBusPublisherFns: NodejsFunction[];
    batchDeleteCommentsEventBusTargetFn: NodejsFunction;
    updateUserGroupsEventBusPublisherFns: NodejsFunction[];
    updateUserGroupsEventBusTargetFn: NodejsFunction;
    batchDeletePostsEventBusPublisherFns: NodejsFunction[];
    batchDeletePostsEventBusTargetFn: NodejsFunction;
}



export function initializeEventBuses(stack: Stack, props: InitializeEventBusesProps): AppEventBuses {
  const { 
    deleteImagesEventBusPublisherFns, 
    deleteImagesEventBusTargetFn, 
    batchDeleteCommentsEventBusPublisherFns, 
    batchDeleteCommentsEventBusTargetFn,
    updateUserGroupsEventBusPublisherFns,
    updateUserGroupsEventBusTargetFn,
    batchDeletePostsEventBusPublisherFns,
    batchDeletePostsEventBusTargetFn
  } = props;
  const deleteImagesEventBus = new DeleteImagesEventBus(stack, {
    publisherFunctions: deleteImagesEventBusPublisherFns,
    targetFunction: deleteImagesEventBusTargetFn,
  }).bus;
  const batchDeleteCommentsEventBus = new BatchDeleteCommentsEventBus(stack, {
    publisherFunctions: batchDeleteCommentsEventBusPublisherFns,
    targetFunction: batchDeleteCommentsEventBusTargetFn,
  }).bus;
  const updateUserGroupsEventBus = new UpdateUserGroupsEventBus(stack, {
    publisherFunctions: updateUserGroupsEventBusPublisherFns,
    targetFunction: updateUserGroupsEventBusTargetFn
  }).bus;
  const batchDeletePostsEventBus = new BatchDeletePostsEventBus(stack, {
    publisherFunctions: batchDeletePostsEventBusPublisherFns,
    targetFunction: batchDeletePostsEventBusTargetFn
  }).bus;

  return { 
    deleteImagesEventBus,
    batchDeleteCommentsEventBus,
    updateUserGroupsEventBus,
    batchDeletePostsEventBus
  };
}