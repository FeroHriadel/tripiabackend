import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";


function generatePolicy(principalId: string, methodArn: string, effect: "Allow" | "Deny"): APIGatewayAuthorizerResult {
  return {
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
  };
}

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return generatePolicy("user", event.methodArn, "Deny");
  }

  try {
    // Decode the token without verifying it to extract the 'iss' (issuer) field
    const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
    if (!decodedJwt || typeof decodedJwt === 'string') {
      throw new Error("Invalid token format");
    }

    const { header, payload } = decodedJwt;

    // Ensure payload is a JwtPayload object
    if (typeof payload !== 'object' || payload === null || !('iss' in payload)) {
      throw new Error("Invalid JWT payload structure");
    }

    const issuer = (payload as jwt.JwtPayload).iss;  // Extract issuer (Cognito User Pool URL)
    if (!issuer || !issuer.includes('cognito-idp')) {
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
        if (err) reject(err);
        else resolve(decodedToken);
      });
    });

    // If token is valid, allow the request
    return generatePolicy("user", event.methodArn, "Allow");

  } catch (error) {
    console.error("Token validation error:", error);
    // Deny access if token validation fails
    return generatePolicy("user", event.methodArn, "Deny");
  }
};
