#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TripiaStack } from '../lib/tripia-stack';
import * as dotenv from 'dotenv';
dotenv.config();



const appName = 'tripia' + '-' + process.env.STAGE;
const region = process.env.REGION;
const accountId = process.env.ACCOUNT_ID;



const app = new cdk.App();
new TripiaStack(app, appName, {
  env: {account: accountId, region},
  stackName: appName
});