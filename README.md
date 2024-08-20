# TRIPIA
- aws serverless IaC backend infrastructure
- backed for a frontend app !TODO: PASTE LINK TO FE!
<br />

## FEATURES
- IaC
- serverless (should scale fantasticaly)
- dynamoDB
- lambdas
- apiGateway

## SOFTWARE VERSIONS
Developed with:
- aws cli 2.17.27
- aws-cdk 2.153.0
- aws-sdk 3.632
- node 20.12.2

## DEPLOYMENT
- download and install aws cli, 
- `npm i -g aws-cdk` 
- create an IAM user with sufficient rights in AWS Console. Get the accessKey and secretKey.
- create a .env in the root and put in the follwoing:
```
STAGE = dev
REGION = us-east-1
ACCOUNT_ID = 222677608122
```
- run `$ npm i`
- `$ aws configure --profile myprofile` => you'll need accessKey and secretKey IDs from AWS Console/IAM for this.
- `$ cdk deploy --profile myprofile`