import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/*******************************************************************************************
 * Trips retrieval: 
 *    1) all trips can be retrieved sorted by updatedAt
 *    2) search trips by createdBy
 *    3) search trips by keyword: either trip.name or trip.description contain the keyword
*******************************************************************************************/



export class TripsTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'TripsTable', {
      tableName: this.stack.stackName + 'TripsTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    //so we can search category by name:
    this.table.addGlobalSecondaryIndex({
      indexName: 'postedBy',
      partitionKey: {name: 'postedBy', type: AttributeType.STRING},
    })

    //so we can get trips ordered by name
      //All trips will have an attribute `type: #TRIP`.
      //When making a query to get all trips sorted by name we specify an equality condition.
      //The equality condition will be: `:trip = '#TRIP'` (which all trips have).
      //This will return all trips ordered by `updatedAt` (`ScanIndexForward: false` in a query will do that).
    this.table.addGlobalSecondaryIndex({
      indexName: 'dateSort', //composite key: has PK and SK
      partitionKey: {name: 'type', type: AttributeType.STRING},
      sortKey: {name: 'updatedAt', type: AttributeType.STRING},
    });
  }
}