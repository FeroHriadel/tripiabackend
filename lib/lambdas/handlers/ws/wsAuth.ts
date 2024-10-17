import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { log } from "../utils";

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
  const token = event.queryStringParameters?.token;
  log("token: ", token);

  if (!token) {
    log("No token provided");
    return generatePolicy("user", event.methodArn, "Deny");
  }

  try {
    // Decode the token without verifying it to extract the 'iss' (issuer) field
    const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
    if (!decodedJwt || typeof decodedJwt === 'string') {
      log("Invalid token format");
      throw new Error("Invalid token format");
    }

    const { header, payload } = decodedJwt;

    // Ensure payload is a JwtPayload object
    if (typeof payload !== 'object' || payload === null || !('iss' in payload)) {
      log("Invalid JWT payload structure");
      throw new Error("Invalid JWT payload structure");
    }

    const issuer = (payload as jwt.JwtPayload).iss; // Extract issuer (Cognito User Pool URL)
    if (!issuer || !issuer.includes('cognito-idp')) {
      log("Invalid token issuer");
      throw new Error("Invalid token issuer");
    }

    // Use the issuer URL to get the JWKS URI
    const client = jwksClient({
      jwksUri: `${issuer}/.well-known/jwks.json`,
    });

    // Helper to retrieve the signing key
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

    // If token is valid, allow the request and pass the decoded token in context
    return generatePolicy("user", event.methodArn, "Allow", { decodedToken: verifiedToken });

  } catch (error) {
    log("Token validation error:", error);
    // Deny access if token validation fails
    return generatePolicy("user", event.methodArn, "Deny");
  }
};
