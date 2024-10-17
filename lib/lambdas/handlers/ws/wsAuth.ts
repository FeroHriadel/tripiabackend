import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";

function generateAllowResponse(principalId: string, methodArn: string): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn,
        },
      ],
    },
  };
}

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log('Authorizer triggered'); // Log statement

  // Allow all requests regardless of token or credentials
  return generateAllowResponse("user", event.methodArn);
};
