import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketAccessPolicyStatement } from "./BucketAccessPolicyStatement";
import { AppBuckets } from "../../types";



interface InitPolicyStatementsProps {
    buckets: AppBuckets;
}



export const initializePolicyStatements = (props: InitPolicyStatementsProps) => {
    const { buckets } = props;
    const imagesBucketAccessStatement = new BucketAccessPolicyStatement(buckets.imagesBucket).policyStatement;
    return {
        imagesBucketAccessStatement,
    };
}