import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient, CfnUserPoolGroup, CfnUserPool } from "aws-cdk-lib/aws-cognito";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dotenv from 'dotenv';
dotenv.config();



export class AppAuthorizer {

    /*
        IMPLEMENTING COGNITO:
            a) We create Cognito/UserPool => that's the database of signed-up users.
            b) We create Cognito/UserPool/UserPoolClient => in AWS a UserPool must have a client. That's the rules. Period.
            c) We create a Cognito/Authorizer for ApiGateway => ApiGateway will use the Authorizer and that will use the UserPool and UserPoolClient we created.
            d) We create a UserPoolGroup ('admin') - users belonging to the group will be considered admins.
    */

    private stack: cdk.Stack;
    private api: RestApi;
    private userPool: UserPool;
    private userPoolClient: UserPoolClient;
    private postConfirmLambda: NodejsFunction;
    public authorizer: CognitoUserPoolsAuthorizer;


    constructor(stack: cdk.Stack, props: {api: RestApi, postConfirmationLambda: NodejsFunction}) {
      this.stack = stack;
      this.api = props.api;
      this.postConfirmLambda = props.postConfirmationLambda;
      this.initialize();
    }


    private initialize() {
      this.addLambdaRights();
      this.createUserPool();
      this.addUserPoolClient();
      this.createAuthorizer();
      this.createAdminGroup();
    }

    private addLambdaRights() {
      this.postConfirmLambda.addToRolePolicy(
        new cdk.aws_iam.PolicyStatement({
          actions: ['cognito-idp:AdminUpdateUserAttributes'],
          resources: ['*'],
        })
      );
    }

    private createUserPool() {
      this.userPool = new UserPool(this.stack, this.stack.stackName + 'UserPool', {
        userPoolName: this.stack.stackName + 'UserPool',
        selfSignUpEnabled: true,
        signInAliases: {email: true},
        removalPolicy: RemovalPolicy.DESTROY,
        passwordPolicy: {minLength: 6, requireLowercase: false, requireDigits: false, requireSymbols: false, requireUppercase: false},
        standardAttributes: { nickname: {required: false, mutable: true}, profilePicture: {required: false, mutable: true}},
        //customAttributes: { 'myappid': new cognito.StringAttribute({ minLen: 5, maxLen: 15, mutable: false }) }
        lambdaTriggers: { postConfirmation: this.postConfirmLambda }
      });
      new CfnOutput(this.stack, 'USER POOL ID', {value: this.userPool.userPoolId}); //log userPoolId so you don't have to go to console for it
    }

    private addUserPoolClient() {
      this.userPoolClient = this.userPool.addClient(this.stack.stackName + 'UserPoolClient', {
        userPoolClientName: this.stack.stackName + 'UserPoolClient',
        authFlows: { //nobody knows what this is, just copy-paste it
          adminUserPassword: true,
          custom: true,
          userPassword: true,
          userSrp: true
        },
        generateSecret: false, //generate client secret? I think you might set it to true as well
        refreshTokenValidity: Duration.days(30), //must be btwn 60min and 1yr
        idTokenValidity: Duration.days(1), //must be btwn 5min and 1day. Must be shorter than refreshTokenValidity
        accessTokenValidity: Duration.days(1), //must be btwn 5min and 1day. Must be shorter than refreshTokenValidity
      });
      new CfnOutput(this.stack, `USER POOL CLIENT ID`, {value: this.userPoolClient.userPoolClientId});
    }

    private createAuthorizer() {
        this.authorizer = new CognitoUserPoolsAuthorizer(this.stack, this.stack.stackName + 'Authorizer', {
            authorizerName: this.stack.stackName + 'Authorizer',
            cognitoUserPools: [this.userPool],
            identitySource: 'method.request.header.Authorization' //look for `Authorization` in req.headers
        });
        this.authorizer._attachToApi(this.api);
    }

    private createAdminGroup() {
        new CfnUserPoolGroup(this.stack, 'admin', {
            groupName: 'admin',
            userPoolId: this.userPool.userPoolId,
        });
    }
}