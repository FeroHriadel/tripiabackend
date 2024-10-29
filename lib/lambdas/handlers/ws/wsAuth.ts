import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { log } from "../utils";
import { getGroupById } from "../dbOperations";

// Modify the generatePolicy function to include context data
function generatePolicy(
  principalId: string,
  methodArn: string,
  effect: "Allow" | "Deny",
  context: { [key: string]: any } = {}
): APIGatewayAuthorizerResult {
  const policy = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: methodArn,
        },
      ],
    },
    context: {data: JSON.stringify(context)}, // Add context data here
  };
  console.log("Policy:", JSON.stringify(policy, null, 2));
  return policy;
}



export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  // get groupId and Cognito idToken from queryStringParams
  const groupId = event.queryStringParameters?.groupId;
  const token = event.queryStringParameters?.token;
  log("token: ", token);
  log("groupId: ", groupId);
  if (!token) { log("No token provided"); return generatePolicy("user", event.methodArn, "Deny"); }
  if (!groupId) { log("No groupId provided"); return generatePolicy("user", event.methodArn, "Deny"); }

  try {
    // decode the token without verifying it to extract the 'iss' (issuer) field
    const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
    if (!decodedJwt || typeof decodedJwt === 'string') { log("Invalid token format"); throw new Error("Invalid token format"); }
    const { header, payload } = decodedJwt;
    if (typeof payload !== 'object' || payload === null || !('iss' in payload)) { log("Invalid JWT payload structure"); throw new Error("Invalid JWT payload structure"); }

    // extract issuer (Cognito User Pool URL)
    const issuer = (payload as jwt.JwtPayload).iss; 
    if (!issuer || !issuer.includes('cognito-idp')) { log("Invalid token issuer"); throw new Error("Invalid token issuer"); }

    // use the issuer URL to get the JWKS URI
    const client = jwksClient({ jwksUri: `${issuer}/.well-known/jwks.json` });

    // helper to retrieve the signing key
    function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
      client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      });
    }

    // Verify the token using the JWKs (public keys)
    const verifiedToken = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decodedToken) => {
        if (err) { log("Token verification error:", err); reject(err); }
        else { log("Token verified:", decodedToken); resolve(decodedToken); }
      });
    });

    const userEmail = (verifiedToken as jwt.JwtPayload)?.email; log('userEmail: ', userEmail);
    if (!userEmail) throw new Error("User email not found in token");
    const group = await getGroupById(groupId); log('group: ', group)
    if (!group.members.includes(userEmail)) throw new Error("User is not a member of this group");


    // if token valid & user is member of group, allow the request and pass the decoded token in context
    return generatePolicy("user", event.methodArn, "Allow", { decodedToken: verifiedToken });

  } catch (error) {
    log("Token validation error:", error);
    // Deny access if token validation fails
    return generatePolicy("user", event.methodArn, "Deny");
  }
};
