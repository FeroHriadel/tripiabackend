import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/**********************************************************************************************
 * Connections management: 
 *    1) connections are stored by connection id
 *    2) all connections for a specific group can be retrieved by groupId
 *********************************************************************************************/



export class ConnectionsTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'ConnectionsTable', {
      tableName: this.stack.stackName + 'ConnectionsTable',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    // GSI to retrieve all connections by groupId
    this.table.addGlobalSecondaryIndex({
      indexName: 'groupIdIndex',
      partitionKey: { name: 'groupId', type: AttributeType.STRING },
    });
  }
}
