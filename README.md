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
- EventBus

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
- the `/lib` folder also holds the code for the creation of all app resources: `/lib/lambdas`, `/lib/buckets`, `lib/apiGateway`...

### LAMBDAS
- are the most complex resource in the app. Once you crack that the rest is a breeze.
- `/lib/lambdas/AppLambda.ts` is used to initiate all app lambdas. Just declare `new AppLambda(stack, props)`.
- AppLambda props can take 2 dynamoDB tables, eventBus, tags, s3bucket, policy statements... and attaches it all to the lambda so you don't have to do it manually. Example:
```
const myLambda = new AppLambda(stack, {
    lambdaName: 'getImageUploadLink', //handler file name
    folder: 'images', //folder name in /lib/lambdas/handlers
    bucket: buckets.imagesBucket, //will put BUCKET_NAME in lambda's environment variables
    policyStatements: {imagesBucketAccessStatement: policyStatements.imagesBucketAccessStatement} //will attach the policy statement to lambda
  }).lambda;
```
- `/lib/lambdas/initLambdas.ts` contains the `initLambdas()` function that calls all the other partial helper functions above it. It initializes all app lambdas.
- If you need to add a new lambda, `/lib/lambdas/initLambdas.ts` is the file to do it in. It does not attach the lambda to api, though! Read on for more on that...
- `/lib/lambdas/attachLambdasToApi.ts` is called as the last thing in the stack. It attaches all the lambdas to the api. It contains the `attachLambdasToApi()` that calls all the other partial helper functions above it.
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
- lambda handler interaction with s3, EventBus, .... is handled directly in the lambda code (no helper file for those interactions).

### RESOURCES OTHER THAN LAMBDAS (S3, TABLES, EVENT BUS, API GATEWAY, AUTHORIZER, POLICY STATEMENTS...)
- all resources follow the same pattern be it S3, DynamoDbTable, ApiGateway... Let's do an example with DynamoDbTable - the remaining types of resources work in the same way:
- resource is located in /lib/resourceTypeName - e.g.: `/lib/tables`
- the folder contains a file which exports a class that creates that resource - e.g.: `/lib/tables/CategoriesTable`
- the folder also contains a file which exports an init function - which initializes the resource(s) - e.g.: `/lib/table/initTables.ts`
- the init function is imported into `/lib/tripia-stack.ts` and invoked. Its invocation initializes the given type of resources and returns their values for further reference. E.g.:

<br />
/lib/tables/CategoriesTable.ts:

```
export class CategoriesTable {
  private stack: cdk.Stack;
  public table: Table;


  public constructor(stack: cdk.Stack) {
    this.stack = stack;
    this.initTable();
  }


  private initTable() {
    this.createTable();
    this.addSecondaryIndexes();
  }

  ...
}
```

<br />
/lib/tables/initTables.ts:

```
export function initTables(stack: cdk.Stack): AppTables {
  return {
    categoriesTable: new CategoriesTable(stack).table,
    tripsTable: new TripsTable(stack).table,
    usersTable: new UsersTable(stack).table,
    favoriteTripsTable: new FavoriteTripsTable(stack).table,
    commentsTable: new CommentsTable(stack).table,
  };
}
```

<br />
/lib/tripia-stack.ts:

```
export class TripiaStack extends cdk.Stack {
  private tables: AppTables;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.initialize();
  }

  
  private initialize() {
    this.initializeTables();
  }

  private initializeTables() {
    this.tables = initTables(this);
  }

  ...
}
```
<br />



## ISSUES
- there's a UsersTable. It seems redundant as the app uses Cognito where all the data of UsersTable could be stored as well. However, querying Cognito users is rigid, expensive and inflexible. No partial string searches are possible. That's why I decided to have the UsersTable where partial string searches are a bit better.
- uses dynamoDB because it works so well with lambdas. There's a price to pay, though: 
- dynamoDB sucks for highly changeable data and their sorting, filtering, table joins, etc. That's why:
- trips have a hardcoded user's nickname (for search reasons). I decided not to update the nickname when user changes their nickname. This way it's theoretically possible for the user to post different trips under a different nickname. I decided it's not a bug but a feature: My ancient friends call me 'Fedo' but my recent friends call me 'Fero'. I prefer 'Fero' but there's no way I can get my old friends to call me that. In a similar vein - trips created under one nickname will always have that nickname, even if the nickname has changed ¯\_(ツ)_/¯
- because the app can search trips by partial string match (contains condition) trips search scans the TripsTable :( Since old trips get deleted on a regular basis I assumed the scan won't get too expensive.


