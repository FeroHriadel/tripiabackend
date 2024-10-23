import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DeleteImagesEventBus } from "./DeleteImagesEventBus";
import { BatchDeleteCommentsEventBus } from "./BatchDeleteCommentsEventBus";
import { UpdateUserGroupsEventBus } from "./UpdateUserGroupsEventBus";
import { Stack } from "aws-cdk-lib";
import { AppEventBuses } from "../../types";



interface InitializeEventBusesProps {
    deleteImagesEventBusPublisherFns: NodejsFunction[];
    deleteImagesEventBusTargetFn: NodejsFunction;
    batchDeleteCommentsEventBusPublisherFns: NodejsFunction[];
    batchDeleteCommentsEventBusTargetFn: NodejsFunction;
    updateUserGroupsEventBusPublisherFns: NodejsFunction[];
    updateUserGroupsEventBusTargetFn: NodejsFunction;
}



export function initializeEventBuses(stack: Stack, props: InitializeEventBusesProps): AppEventBuses {
  const { 
    deleteImagesEventBusPublisherFns, 
    deleteImagesEventBusTargetFn, 
    batchDeleteCommentsEventBusPublisherFns, 
    batchDeleteCommentsEventBusTargetFn,
    updateUserGroupsEventBusPublisherFns,
    updateUserGroupsEventBusTargetFn
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

  return { 
    deleteImagesEventBus,
    batchDeleteCommentsEventBus,
    updateUserGroupsEventBus
  };
}