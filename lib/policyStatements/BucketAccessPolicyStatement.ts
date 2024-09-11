import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";




export class BucketAccessPolicyStatement {
    public policyStatement: PolicyStatement;
    private bucket: Bucket;

    constructor(bucket: Bucket) {
        this.bucket = bucket;
        this.initialize();
    } 

    private initialize() {
        this.createPolicyStatement();
    }

    private createPolicyStatement() {
        this.policyStatement = new PolicyStatement({
            actions: ['s3:*'],
            resources: [this.bucket.bucketArn], //change to ['arn:aws:s3:::*'] if aws giving you grief
            effect: Effect.ALLOW
        });
        //attach it to lambda like: myLambda.role?.attachInlinePolicy(new Policy(this.stack, 'MyLambdaBucketAccess', {statements: [this.bucketAccessStatement]}));
    }
}