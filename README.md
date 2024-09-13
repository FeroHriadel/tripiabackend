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

## CODE WALK-THRU
- `/bin/tripia.ts` is where the app is created.
- `/lib/tripia-stack.ts` is where all the app resources are initiated. It's a long file but it's quite readable. Does 3 things:
1) declares variables that hold app resources (tables, buckets, lambdas...)
2) initializes app resources and saves the return values in the variables decalred in 1) for easy access
3) attaches lambdas to api once all resources have been created
- the `/lib` folder also holds the code for the creation of all app resources: `/lip/lambdas`, `/lib/buckets`, `lib/apiGateway`...

### LAMBDAS
- are the most complex resource in the app. Once you crack that the rest is a breeze.
- `/lib/lambdas/AppLambda.ts` is used to initiate all app lambdas. Just declare `new AppLambda(stack, props)`.
- AppLambda props can take 2 dynamoDB tables, eventBus, tags, s3bucket, policy statements and attaches it all to the lambda so you don't have to do it manually. Example:
```
const myLambda = new AppLambda(stack, {
    lambdaName: 'getImageUploadLink', //handler file name
    folder: 'images', //folder name in /lib/lambdas/handlers
    bucket: buckets.imagesBucket, //will put BUCKET_NAME in lambda's environment varaibles
    policyStatements: {imagesBucketAccessStatement: policyStatements.imagesBucketAccessStatement} //will attach the policy statement to lambda
  }).lambda;
```
- `/lib/lambdas/initLambdas.ts` contains the `initLambdas()` function that calls all the other partial helper functions above. It initializes all app lambdas..
- If you need to add a new lambda, `/lib/lambdas/initLambdas.ts` is the file to do it in. It does not attach the lambda to api, though! Read on for more on that...
- `/lib/lambdas/attachLambdasToApi.ts` is called as the last thing in the stack. It attaches all the lambdas to the api. It contains the `attachLambdasToApi()` that calls all the other partial helper functions above.
- If you need to attach a lambda to api `/lib/lambdas/attachLambdasToApi.ts` is a file to do it in. If you want the lambda to be protected by app authorizer, add the `authorizer` prop:
```
function addUsersEndpoints(props: AddUsersEndpointsProps) {
  const { api, lambdaIntegrations, authorizer } = props;
  const resource = createResource({pathName: 'users', api});
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['userUpdate'], method: 'PUT', authorizer}); //note the authorizer prop
  addFunctionToResource({resource, lambdaIntegration: lambdaIntegrations['userGet'], method: 'POST'}); //this lambda has no authorizer
}
```
- `/lib/lambdas/handlers` contains all the lambda handlers (code that runs when lambdas are invoked)
- the `handlers` folder is further organized topically: `categories`, `users`, `trips`...
- naming convention is: `tripCreate`, `tripGet`, `tripUpdate`, `tripDelete` - handlers that don't fall into the CRUD routine have no naming convention
- all dynamoDB operations are in `/lib/lambdas/handlers/dbOperations` so the lambda handler code doesn't get too long and unreadable.
- lambda handler interaction with s3, EventBus, .... is handled directlty in the lambda.
