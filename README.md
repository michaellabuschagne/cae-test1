# EnPowered CAE Test1

## Quick start
1. Create an S3 bucket in the region you will be launching your CloudFormation stack.
2. Run ``npm install`` from the project root to install all dependencies and sub dependencies.
3. Run ``npm run deploy --s3bucket=<S3_BUCKET_NAME> --region=<AWS_REGION>`` and replace ``<S3_BUCKET_NAME>`` with the S3bucket you created in step 1 and replace ``<AWS_REGION>`` with the AWS region you would like the stack created in.
4. Monitor the CloudFormation stack creation, it shouldn't take longer than 5 minutes to complete.
5. Once the stack is up take note of the CloudFormation stack JSON output which contains the API Gateway endpoint in the field ``APIGatewayEndpoint``.
6. After around 5 - 10 minutes there should be data in the DynamoDB table, and the API endpoint should be returning data.

***NOTES***
- Ensure you are utilising AWS credentials which have read\write permissions to the bucket referred to in step 1.
- The build and deploy process has only been tested on MacOS and users utilising Windows or *nix operating systems will likely encounter issues.

## Basic specifications
- [x] Generate fake customer usage data for 1000 customers every 5 minutes
- [x] Generate fake energy prices every 5 minutes
- [x] Calculate each customers hourly energy costs 
- [x] DynamoDB table name should be ``cae-test-1`` and all data is written here
- [x] Provide an HTTP endpoint to query by customerid, start, and end dates
- [x] API Gateway endpoint conform to the provided format
- [x] Customer Bill data should conform to the format provided 
- [x] Place CloudFormation resource definitions in ``cae-test1.cf.json``
- [x] Place Lambda function code into the ``lambda`` directory
- [x] Customers should have a unique identifier between 1 and 1000
- [x] Entire application can be deployed with the command ``npm run deploy`` (with ``--s3bucket=<S3_BUCKET_NAME>``)