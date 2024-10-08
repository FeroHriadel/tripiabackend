import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Stack, Tags } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { AppPolicyStatemens, EventBusData } from "../../types";
import { Policy, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";



/********************************************************
 - run `npm i esbuild` else NodeJsFunctions won't deploy
*********************************************************/



interface AppLambdaProps {
  lambdaName: string;
  folder: string;
  table?: Table;
  tableWriteRights?: boolean;
  secondaryTable?: Table;
  secondaryTableWriteRights?: boolean;
  tags?: {[key: string]: string};
  bucket?: Bucket;
  policyStatements?: {[key: string]: PolicyStatement};
  eventBusData?: EventBusData;
  secondaryEventBusData?: EventBusData;
}



export class AppLambda {
  private stack: Stack;
  private lambdaName: string;
  private folder: string;
  private table: Table;
  private tableWriteRights: boolean;
  private secondaryTable?: Table;
  private secondaryTableWriteRights?: boolean;
  private tags: {[key: string]: string};
  private bucket: Bucket;
  private policyStatements: {[key: string]: PolicyStatement};
  private eventBusData: EventBusData;
  private secondaryEventBusData: EventBusData;
  public lambda: NodejsFunction;


  public constructor(stack: Stack, props: AppLambdaProps) {
    const { lambdaName, folder, table, tableWriteRights, secondaryTable, secondaryTableWriteRights, tags, bucket, policyStatements, eventBusData, secondaryEventBusData } = props;
    this.stack = stack;
    this.lambdaName = lambdaName;
    this.folder = folder;
    if (table) this.table = table;
    if (tableWriteRights) this.tableWriteRights = tableWriteRights;
    if (secondaryTable) this.secondaryTable = secondaryTable;
    if (secondaryTableWriteRights) this.secondaryTableWriteRights = secondaryTableWriteRights;
    this.tags = tags || {};
    if (bucket) this.bucket = bucket;
    if (policyStatements) this.policyStatements = policyStatements;
    if (eventBusData) this.eventBusData = eventBusData;
    if (secondaryEventBusData) this.secondaryEventBusData = secondaryEventBusData;
    this.initialize();
  }


  private initialize() {
    this.createLambda();
    if (this.table) this.addTablesRights();
    if (this.policyStatements) this.addRoles();
    this.addTags();
    if (this.eventBusData) this.addInvokeEventBusPermission();
    if (this.secondaryEventBusData) this.addInvokeSecondaryEventBusPermission();
  }

  private createLambda() {
    this.lambda = new NodejsFunction(this.stack, this.stack.stackName + this.lambdaName, {
      entry: (join(__dirname, 'handlers', this.folder, `${this.lambdaName}.ts`)),
      handler: 'handler',
      functionName: this.stack.stackName + this.lambdaName,
      environment: {
        REGION: process.env.REGION || 'region not defined!',
        TABLE_NAME: this.table?.tableName || 'no table defined!',
        SECONDARY_TABLE_NAME: this.secondaryTable?.tableName || 'no secondary table defined!',
        BUCKET_NAME: this.bucket?.bucketName || 'no bucket defined!',
        EVENT_BUS_SOURCE: this.eventBusData?.source[0] || 'no event bus source defined!',
        EVENT_BUS_DETAIL_TYPE: this.eventBusData?.detailType[0] || 'no event bus detail type defined!',
        EVENT_BUS_NAME: this.eventBusData?.busName || 'no event bus name defined!',
        SECONDARY_EVENT_BUS_SOURCE: this.secondaryEventBusData?.source[0] || 'no secondary event bus source defined!',
        SECONDARY_EVENT_BUS_DETAIL_TYPE: this.secondaryEventBusData?.detailType[0] || 'no secondary event bus detail type defined!',
        SECONDARY_EVENT_BUS_NAME: this.secondaryEventBusData?.busName || 'no secondary event bus name defined!'
      }
    })
  }

  private addTablesRights() {
    if (this.tableWriteRights) this.table.grantReadWriteData(this.lambda);
    else this.table?.grantReadData(this.lambda);
    if (this.secondaryTableWriteRights) this.secondaryTable?.grantReadWriteData(this.lambda);
    else this.secondaryTable?.grantReadData(this.lambda);
  }

  private addRoles() {
    Object.keys(this.policyStatements).forEach((key) => {
        this.lambda.role?.attachInlinePolicy(new Policy(this.stack, `${this.lambdaName}${key}`, {
            statements: [this.policyStatements[key]]
        }));
    })
  }

  private addTags() {
    Object.keys(this.tags).forEach((key) => {
      Tags.of(this.lambda).add(this.tags[key], this.tags[key]);
    });
  }

  private addInvokeEventBusPermission() {
    this.lambda.addPermission(`${this.lambdaName}Allow${this.eventBusData.busName}Invoke`, {
      principal: new ServicePrincipal('events.amazonaws.com'),
      sourceArn: this.stack.formatArn({
        service: 'events',
        resource: 'rule',
        resourceName: `${this.eventBusData.ruleName}`
      })
    });
  }

  private addInvokeSecondaryEventBusPermission() {
    this.lambda.addPermission(`${this.lambdaName}Allow${this.secondaryEventBusData.busName}Invoke`, {
      principal: new ServicePrincipal('events.amazonaws.com'),
      sourceArn: this.stack.formatArn({
        service: 'events',
        resource: 'rule',
        resourceName: `${this.secondaryEventBusData.ruleName}`
      })
    });
  }
}