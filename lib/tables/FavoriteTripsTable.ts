import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/**********************************************************************************************
 * Trips retrieval: 
 *    1) getFavoriteTripsByEmail
**********************************************************************************************/



export class FavoriteTripsTable {
  private stack: cdk.Stack;
  public table: Table;


  public constructor(stack: cdk.Stack) {
    this.stack = stack;
    this.initTable();
  }


  private initTable() {
    this.createTable();
  }

  private createTable() {
    this.table = new Table(this.stack, this.stack.stackName + 'FavoriteTripsTable', {
      tableName: this.stack.stackName + 'FavoriteTripsTable',
      partitionKey: {name: 'email', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }
}