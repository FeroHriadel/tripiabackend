import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';




export class InvitationsTable {
  private stack: cdk.Stack;
  public table: Table;


  public constructor(stack: cdk.Stack) {
    this.stack = stack;
    this.initTable();this.addSecondaryIndexes();
  }


  private initTable() {
    this.createTable();
  }

  private createTable() {
    this.table = new Table(this.stack, this.stack.stackName + 'InvitationsTable', {
      tableName: this.stack.stackName + 'InvitationsTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    this.table.addGlobalSecondaryIndex({
      indexName: 'typeInviteeIndex',
      partitionKey: {name: 'type', type: AttributeType.STRING},
      sortKey: {name: 'invitee', type: AttributeType.STRING},
    });
  }
}