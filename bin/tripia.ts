#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TripiaStack } from '../lib/tripia-stack';
import { appName } from '../utils/resourceValues';
import * as dotenv from 'dotenv';
dotenv.config();



/*********************************************************
 - deploy like: `$ cdk deploy --profile ferohriadeladmin`
**********************************************************/



const region = process.env.REGION;
const accountId = process.env.ACCOUNT_ID;



const app = new cdk.App();
new TripiaStack(app, appName, {
  env: {account: accountId, region},
  stackName: appName
});