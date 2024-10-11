import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/**********************************************************************************************
 * Posts (belong to Group) retrieval: 
 *    1) posts can be retrieved by groupId and sorted by createdAt at the same time
**********************************************************************************************/



export class PostsTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'PostsTable', {
      tableName: this.stack.stackName + 'PostsTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    // To retrieve posts by groupId and sort by createdAt
    this.table.addGlobalSecondaryIndex({
      indexName: 'groupIdIndex',
      partitionKey: {name: 'groupId', type: AttributeType.STRING},
      sortKey: {name: 'createdAt', type: AttributeType.STRING},
    });
  }
}
