import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";



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
}



export class AppLambda {
  private stack: Stack;
  private lambdaName: string;
  private folder: string;
  private table: Table;
  private tableWriteRights: boolean;
  private secondaryTable?: Table;
  private secondaryTableWriteRights?: boolean;
  public lambda: NodejsFunction;


  public constructor(stack: Stack, props: AppLambdaProps) {
    const { lambdaName, folder, table, tableWriteRights, secondaryTable, secondaryTableWriteRights } = props;
    this.stack = stack;
    this.lambdaName = lambdaName;
    this.folder = folder;
    if (table) this.table = table;
    if (tableWriteRights) this.tableWriteRights = tableWriteRights;
    if (secondaryTable) this.secondaryTable = secondaryTable;
    if (secondaryTableWriteRights) this.secondaryTableWriteRights = secondaryTableWriteRights;
    this.initialize();
  }


  private initialize() {
    this.createLambda();
    if (this.table) this.addTableRights();
  }

  private createLambda() {
    this.lambda = new NodejsFunction(this.stack, this.stack.stackName + this.lambdaName, {
      entry: (join(__dirname, 'handlers', this.folder, `${this.lambdaName}.ts`)),
      handler: 'handler',
      functionName: this.stack.stackName + this.lambdaName,
      environment: {
        REGION: process.env.REGION || 'region not defined!',
        TABLE_NAME: this.table?.tableName || 'no table defined!',
        SECONDARY_TABLE_NAME: this.secondaryTable?.tableName || 'no secondary table defined!'
      }
    })
  }

  private addTableRights() {
    if (this.tableWriteRights) this.table.grantReadWriteData(this.lambda);
    else this.table.grantReadData(this.lambda);
    if (this.secondaryTableWriteRights) this.secondaryTable?.grantReadWriteData(this.lambda);
    else this.secondaryTable?.grantReadData(this.lambda);
  }
}