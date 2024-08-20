import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppTables } from '../types';
import { initTables } from './tables/initTables';



export class TripiaStack extends cdk.Stack {
  private tables: AppTables;


  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.initialize();
  }


  private initialize() {
    this.initializeTables();
  }

  private initializeTables() {
    this.tables = initTables(this);
  }
}
