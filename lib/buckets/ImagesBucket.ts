import { Bucket, HttpMethods, BucketPolicy, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy, Stack, CfnOutput } from "aws-cdk-lib";
import { PolicyStatement, Effect, AnyPrincipal, ArnPrincipal } from "aws-cdk-lib/aws-iam";
import { imagesBucketAccessTag } from "../../utils/resourceValues";
import * as dotenv from 'dotenv';
dotenv.config();



const accountId = process.env.ACCOUNT_ID;



export class ImagesBucket {
    public bucket: Bucket;
    private stack: Stack;

    constructor(stack: Stack) {
        this.stack = stack;
        this.initialize();
    }

    private initialize() {
        this.createBucket();
        this.addPutObjectStatement();
        this.addReadWriteStatement();
    }

    private createBucket() {
      const bucketName = (this.stack.stackName + 'images-bucket-ioioioi').toLowerCase()
        this.bucket = new Bucket(this.stack, bucketName, {
            bucketName: bucketName,
            objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED, //enables ACLs (else image upload from website fails)
            blockPublicAccess: {blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false}, //enables adding bucket policy from cdk - cdk can't deploy bucket w/o this
            cors: [{ //open bucket to the internet
                allowedMethods: [
                  HttpMethods.HEAD,
                  HttpMethods.GET,
                  HttpMethods.PUT,
                  HttpMethods.POST,
                  HttpMethods.DELETE,
                ],
                allowedOrigins: ['*'],
                allowedHeaders: ['*']
            }],
            publicReadAccess: true, //so website can display images w/o having to do GetObject signed link
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });
        new CfnOutput(this.stack, `IMAGES BUCKET DOMAIN NAME`, {value: this.bucket.bucketDomainName});
    }

    private addPutObjectStatement() {
        const putObjectStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [this.bucket.bucketArn + '/*'],
            principals: [new AnyPrincipal()] //wouldn't be possible to upload from FE without this
        });
        this.bucket.addToResourcePolicy(putObjectStatement);
    }

    private addReadWriteStatement() {
        const readWriteStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:*'],
            resources: [this.bucket.bucketArn + '/*'],
            principals: [new AnyPrincipal()], //anyone can read/write - but...
            conditions: {
                "StringLike": {
                    [`aws:PrincipalTag/${imagesBucketAccessTag}`]: [imagesBucketAccessTag], //...must have imagesBucketAccessTag
                    "aws:PrincipalArn": [`arn:aws:iam::${accountId}:role*`] //...and must be from my account
                },
            }
        });
        this.bucket.addToResourcePolicy(readWriteStatement);
    }
}