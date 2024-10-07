import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/***********************************************************************
 * Groups retrieval: 
 *    1) search groups by createdBy 
***********************************************************************/



export class GroupsTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'GroupsTable', {
      tableName: this.stack.stackName + 'GroupsTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    this.table.addGlobalSecondaryIndex({
      indexName: 'createdBy',
      partitionKey: {name: 'createdBy', type: AttributeType.STRING},
      sortKey: {name: 'name', type: AttributeType.STRING},
    });
  }
}