import { Stack } from "aws-cdk-lib";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { deleteImagesBusSource, deleteImagesBusDetailType, deleteImagesEventBusName, deleteImagesEventBusRuleName } from "../../utils/resourceValues";
import { batchDeleteCommentsBusSource, batchDeleteCommentsBusDetailType, batchDeleteCommentsEventBusName, batchDeleteCommentsEventBusRuleName } from "../../utils/resourceValues";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";



interface BatchDeleteCommentsEventBusProps {
    publisherFunctions: NodejsFunction[];
    targetFunction: NodejsFunction;
}



export class BatchDeleteCommentsEventBus {

    public bus: EventBus;
    private rule: Rule;
    private stack: Stack;
    private source: string[];
    private detailType: string[];
    private busName: string;
    private ruleName: string;
    private publisherFunctions: NodejsFunction[];
    private targetFunction: NodejsFunction;


    constructor(stack: Stack, props: BatchDeleteCommentsEventBusProps) {
        this.stack = stack;
        this.source = batchDeleteCommentsBusSource;
        this.detailType = batchDeleteCommentsBusDetailType;
        this.busName = batchDeleteCommentsEventBusName;
        this.ruleName = batchDeleteCommentsEventBusRuleName;
        this.publisherFunctions = props.publisherFunctions;
        this.targetFunction = props.targetFunction;
        this.initialize();
    }


    private initialize() {
        this.createBus();
        this.createBusRule();
        this.addInvokePermission();
        this.addBusRuleTarget();
        this.grantPutEventsToPublishers();
    }

    private createBus() {
        this.bus = new EventBus(this.stack, this.busName, {eventBusName: this.busName});
    }

    private createBusRule() {
        this.rule = new Rule(this.stack, this.ruleName, {
            eventBus: this.bus,
            enabled: true,
            description: 'Delete trip comments',
            eventPattern: {
                source: this.source,
                detailType: this.detailType,
            },
            ruleName: this.ruleName
        });
    }

    private addInvokePermission() {
        this.targetFunction.addPermission('AllowEventBridgeInvoke', {
          principal: new ServicePrincipal('events.amazonaws.com'),
          sourceArn: this.stack.formatArn({
            service: 'events',
            resource: 'rule',
            resourceName: this.busName
          }),
        });
    }

    private addBusRuleTarget() {
        this.rule.addTarget(new LambdaFunction(this.targetFunction));
    }

    private grantPutEventsToPublisher(publisherFn: NodejsFunction) {
        this.bus.grantPutEventsTo(publisherFn);
    }

    private grantPutEventsToPublishers() {
        this.publisherFunctions.forEach(publisherFn => this.grantPutEventsToPublisher(publisherFn));
    }
}