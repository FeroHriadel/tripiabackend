import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/*******************************************************************************************
 * User retrieval: 
 *    Users's don't have id but email as the partition key
 *    1) get user by email
*******************************************************************************************/


export class UsersTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'UsersTable', {
      tableName: this.stack.stackName + 'UsersTable',
      partitionKey: {name: 'email', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    this.table.addGlobalSecondaryIndex({
      indexName: 'TypeNicknameLowerIndex',
      partitionKey: { name: 'type', type: AttributeType.STRING },
      sortKey: { name: 'nickname_lower', type: AttributeType.STRING },
    });
  }
}