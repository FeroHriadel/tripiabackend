import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DeleteImagesEventBus } from "./DeleteImagesEventBus";
import { Stack } from "aws-cdk-lib";
import { AppEventBuses } from "../../types";



interface InitializeEventBusesProps {
    deleteImagesEventBusPublisherFns: NodejsFunction[];
    deleteImagesEventBusTargetFn: NodejsFunction;
}



export function initializeEventBuses(stack: Stack, props: InitializeEventBusesProps): AppEventBuses {
  const { deleteImagesEventBusPublisherFns, deleteImagesEventBusTargetFn } = props;
  const deleteImagesEventBus = new DeleteImagesEventBus(stack, {
    publisherFunctions: deleteImagesEventBusPublisherFns,
    targetFunction: deleteImagesEventBusTargetFn,
  }).bus;

  return { deleteImagesEventBus };
}