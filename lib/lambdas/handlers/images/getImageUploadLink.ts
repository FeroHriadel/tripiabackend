import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { res, log } from '../utils';
import { ResponseError } from '../ResponseError';



const client = new S3Client({region: process.env.REGION});



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        //get fileName from body
        const body = JSON.parse(event.body!);
        let { fileName } = body;
        if (!fileName) throw new ResponseError(400, 'fileName is required');
        log('fileName: ', fileName);

        //create params
        const randomString = (Math.random() * 100000).toFixed(0).toString();
        fileName = fileName.split(' ').join(''); //remove empty spaces or you will have a problem with `%` later
        const Key = `${fileName}${randomString}.png`;
        const Bucket = process.env.BUCKET_NAME!;
        const expiresIn = 300; //5 minutes
        console.log('params: ', {Key, Bucket, expiresIn});

        //create command
        const command = new PutObjectCommand({Bucket, Key});
        const presignedUrl = await getSignedUrl(client, command, {expiresIn});
        log('presignedUrl', presignedUrl);

        //return presignedUrl
        return res(200, {url: presignedUrl});

    } catch (error) {
        if (error instanceof Error || error instanceof ResponseError) {
            return res(
                (error as ResponseError).statusCode || 500, 
                {error: error.message || 'Something went wrong'}
            );
        }
        return res(500, {error: 'Something went wrong'});
    }
}