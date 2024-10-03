import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/**********************************************************************************************
 * Comments retrieval: 
 *    1) comments can be retrieved by trip.id and sorted by createdAt at the same time
**********************************************************************************************/



export class CommentsTable {
  private stack: cdk.Stack;
  public table: Table;


  public constructor(stack: cdk.Stack) {
    this.stack = stack;
    this.initTable();
  }


  private initTable() {
    this.createTable();
    this.addSecondaryIndexes();
  }

  private createTable() {
    this.table = new Table(this.stack, this.stack.stackName + 'CommentsTable', {
      tableName: this.stack.stackName + 'CommentsTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    //so we can search comments by trip.id (and with `ScanIndexForward: false` get from freshest to oldest)
    this.table.addGlobalSecondaryIndex({
      indexName: 'trip',
      partitionKey: {name: 'trip', type: AttributeType.STRING},
      sortKey: {name: 'createdAt', type: AttributeType.STRING},
    })
  }
}