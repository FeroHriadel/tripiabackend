import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DeleteObjectsCommand, DeleteObjectsCommandInput, S3Client } from '@aws-sdk/client-s3';
import { res } from '../utils';
import { ResponseError } from '../ResponseError';



const client = new S3Client({region: process.env.REGION});



async function deleteImages(imagesObj: {[key: string]: string}) {
    const params: DeleteObjectsCommandInput = {
        Bucket: process.env.BUCKET_NAME,
        Delete: {
            Objects: Object.values(imagesObj).map(image => ({Key: image})),
            Quiet: false
        }
    }
    console.log('params: ', params);
    return await client.send(new DeleteObjectsCommand(params));
}



export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        //get images from event.eventType.detail
        console.log('Event is: ', event);
        if (!(event as any).detail?.images) throw new ResponseError(400, 'No images to delete');
        console.log('Images to delete: ', (event as any).detail.images);

        //delete images
        let deletionResult = await deleteImages((event as any).detail.images);
        console.log('deletionResult', deletionResult);
        return res(200, {message: 'Deleted', deletionResult});

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