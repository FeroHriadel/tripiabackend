import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DeleteImagesEventBus } from "./DeleteImagesEventBus";
import { Stack } from "aws-cdk-lib";
import { AppEventBuses } from "../../types";
import { BatchDeleteCommentsEventBus } from "./BatchDeleteCommentsEventBus";



interface InitializeEventBusesProps {
    deleteImagesEventBusPublisherFns: NodejsFunction[];
    deleteImagesEventBusTargetFn: NodejsFunction;
    batchDeleteCommentsEventBusPublisherFns: NodejsFunction[];
    batchDeleteCommentsEventBusTargetFn: NodejsFunction;
}



export function initializeEventBuses(stack: Stack, props: InitializeEventBusesProps): AppEventBuses {
  const { deleteImagesEventBusPublisherFns, deleteImagesEventBusTargetFn, batchDeleteCommentsEventBusPublisherFns, batchDeleteCommentsEventBusTargetFn } = props;
  const deleteImagesEventBus = new DeleteImagesEventBus(stack, {
    publisherFunctions: deleteImagesEventBusPublisherFns,
    targetFunction: deleteImagesEventBusTargetFn,
  }).bus;
  const batchDeleteCommentsEventBus = new BatchDeleteCommentsEventBus(stack, {
    publisherFunctions: batchDeleteCommentsEventBusPublisherFns,
    targetFunction: batchDeleteCommentsEventBusTargetFn,
  }).bus;
  return { 
    deleteImagesEventBus,
    batchDeleteCommentsEventBus
  };
}