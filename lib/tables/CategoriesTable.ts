import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';



/***********************************************************************
 * Categories retrieval: 
 *    1) search category by name 
 *    2) all categories can be retrieved sorted alphabetically by name
***********************************************************************/



export class CategoriesTable {
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
    this.table = new Table(this.stack, this.stack.stackName + 'CategoriesTable', {
      tableName: this.stack.stackName + 'CategoriesTable',
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }

  private addSecondaryIndexes() {
    //so we can search category by name:
    this.table.addGlobalSecondaryIndex({
      indexName: 'name',
      partitionKey: {name: 'name', type: AttributeType.STRING},
    })

    //so we can get categories order by name
      //All categories will have an attribute `type: #CATEGORY`.
      //When making a query to get all categories sorted by name we specify an equality condition.
      //The equality condition will be: `:category = '#CATEGORY'` (which all categories have).
      //This will return all categories ordered by `name` (`ScanIndexForward: true` in a query will do that).
    this.table.addGlobalSecondaryIndex({
      indexName: 'nameSort', //composite key: has PK and SK
      partitionKey: {name: 'type', type: AttributeType.STRING},
      sortKey: {name: 'name', type: AttributeType.STRING},
    });
  }
}