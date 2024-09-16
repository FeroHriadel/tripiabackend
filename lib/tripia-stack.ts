import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppBuckets, AppEventBuses, AppLambdas, AppPolicyStatemens, AppTables } from '../types';
import { initTables } from './tables/initTables';
import { initLambdas } from './lambdas/initLambdas';
import { RestApi, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { AppApiGateway } from './apiGateway/AppApiGateway';
import { attachLambdasToApi } from './lambdas/attachLambdasToApi';
import { AppAuthorizer } from './authorizer/AppAuthorizer';
import { ImagesBucket } from './buckets/ImagesBucket';
import { initializePolicyStatements } from './policyStatements/initializePolicyStatements';
import { initializeEventBuses } from './eventBuses/initializeEventBuses';



export class TripiaStack extends cdk.Stack {
  private tables: AppTables;
  private buckets: AppBuckets;
  private policyStatements: AppPolicyStatemens;
  private lambdas: AppLambdas;
  private eventBuses: AppEventBuses;
  private apiGateway: RestApi;
  private authorizer: CognitoUserPoolsAuthorizer;


  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.initialize();
  }

  
  private initialize() {
    this.initializeTables();
    this.initializeBuckets();
    this.initPolicyStatements();
    this.initializeLambdas();
    this.initAppEventBuses();
    this.initApiGateway();
    this.initAppAuthorizer();
    this.attachLambdas();
  }

  private initializeTables() {
    this.tables = initTables(this);
  }

  private initializeBuckets() {
    this.buckets = {
      imagesBucket: new ImagesBucket(this).bucket
    };
  }

  private initPolicyStatements() {
    this.policyStatements = initializePolicyStatements({buckets: this.buckets});
  }

  private initializeLambdas() {
    this.lambdas = initLambdas(this, {
      tables: {
        categoriesTable: this.tables.categoriesTable,
        tripsTable: this.tables.tripsTable,
        usersTable: this.tables.usersTable,
        favoriteTripsTable: this.tables.favoriteTripsTable,
      },
      buckets: this.buckets,
      policyStatements: this.policyStatements
    });
  }

  private initAppEventBuses() {
    this.eventBuses = initializeEventBuses(this, {
      deleteImagesEventBusPublisherFns: [this.lambdas.userUpdate!],
      deleteImagesEventBusTargetFn: this.lambdas.deleteImages!
    })
  }

  private initApiGateway() {
    this.apiGateway = new AppApiGateway(this).api;
  }

  private initAppAuthorizer() {
    this.authorizer = new AppAuthorizer(this, {
      api: this.apiGateway, 
      postConfirmationLambda: this.lambdas.cognitoPostSignup!
    }).authorizer;
  }

  private attachLambdas() {
    attachLambdasToApi({api: this.apiGateway, lambdas: this.lambdas, authorizer: this.authorizer});
  }
}
