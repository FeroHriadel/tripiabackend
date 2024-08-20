import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppLambdas, AppTables } from '../types';
import { initTables } from './tables/initTables';
import { initLambdas } from './lambdas/initLambdas';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AppApiGateway } from './apiGateway/AppApiGateway';



export class TripiaStack extends cdk.Stack {
  private tables: AppTables;
  private lambdas: AppLambdas;
  private apiGateway: RestApi;


  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.initialize();
  }


  private initialize() {
    this.initializeTables();
    this.initializeLambdas();
  }

  private initializeTables() {
    this.tables = initTables(this);
  }

  private initializeLambdas() {
    this.lambdas = initLambdas(this, {
      tables: {
        categoriesTable: this.tables.categoriesTable
      }
    });
  }

  private initApigateway() {
    this.apiGateway = new AppApiGateway(this).api;
  }
}
