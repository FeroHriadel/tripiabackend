import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppBuckets, AppEventBuses, AppLambdas, WsLambdas, AppPolicyStatemens, AppTables } from '../types';
import { initTables } from './tables/initTables';
import { initLambdas } from './lambdas/initLambdas';
import { initWsLambdas } from './lambdas/initWsLambdas';
import { RestApi, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { AppApiGateway } from './apiGateway/AppApiGateway';
import { AppWsGateway } from './wsGateway/AppWsGateway';
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
  private wsLambdas: WsLambdas;
  private eventBuses: AppEventBuses;
  private apiGateway: RestApi;
  private wsGateway: apigatewayv2.WebSocketApi;
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
    this.initializeWsLambdas();
    this.initAppEventBuses();
    this.initApiGateway();
    this.initAppAuthorizer();
    this.initializeWsGateway();
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
    this.lambdas = initLambdas(this, {tables: this.tables, buckets: this.buckets, policyStatements: this.policyStatements});
  }

  private initializeWsLambdas() {
    this.wsLambdas = initWsLambdas(this, {tables: this.tables, buckets: this.buckets, policyStatements: this.policyStatements});
  }

  private initAppEventBuses() {
    this.eventBuses = initializeEventBuses(this, {
      deleteImagesEventBusPublisherFns: [
        this.lambdas.userUpdate!, 
        this.lambdas.tripDelete!, 
        this.lambdas.tripUpdate!, 
        this.lambdas.commentDelete!,
        this.lambdas.commentBatchDelete!,
        this.wsLambdas.postDelete!
      ],
      deleteImagesEventBusTargetFn: this.lambdas.deleteImages!,
      batchDeleteCommentsEventBusPublisherFns: [
        this.lambdas.tripDelete!
      ],
      batchDeleteCommentsEventBusTargetFn: this.lambdas.commentBatchDelete!
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

  private initializeWsGateway() {
    this.wsGateway = new AppWsGateway(this, {wsLambdas: this.wsLambdas}).wsApi;
  }

  private attachLambdas() {
    attachLambdasToApi({api: this.apiGateway, lambdas: this.lambdas, authorizer: this.authorizer});
  }
}
