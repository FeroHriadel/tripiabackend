import * as dotenv from 'dotenv';
dotenv.config();



export const appName = 'tripia' + '-' + process.env.STAGE;

export const imagesBucketAccessTag = 'imagesBucketAccessTag';