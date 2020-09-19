const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const HOURLY_CUST_ID_TYPE_PREFIX = 'hourly_customer_';

exports.queryCustomerBill = (event, context, callback) => {
    console.log(JSON.stringify(event));

    // TODO validate query params "event.queryStringParameters.customerid"
    console.log(event.queryStringParameters);
    const { customerid, start, end } = event.queryStringParameters;
    const customerIdNoLeading = parseInt(customerid);
    const type = `${HOURLY_CUST_ID_TYPE_PREFIX}${customerIdNoLeading}`;
    const epochIntervalStart = Date.parse(start)/1000;
    const epochIntervalEnd = (Date.parse(end)/1000);

    queryCustomerBill(type, epochIntervalStart, epochIntervalEnd).then(result => {
        const responseObject = result.Items.map(item => {
            return {
                customerId: customerIdNoLeading,
                intervalStart: epochToIsoDateString(item.Interval),
                intervalEnd: epochToIsoDateString(item.Interval + 3540),
                totalUsage: item.TotalUsage,
                costs: item.Costs
            };
        });
        callback(null, {
            statusCode: 200,
            body: JSON.stringify(responseObject),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }).catch((error) => {
        console.error(error);
        errorResponse(error.message, context.awsRequestId, callback)
    });
};

const epochToIsoDateString = epoch => {
    const date = new Date(epoch * 1000);
    return date.toISOString();
}

const queryCustomerBill = (type, epochIntervalStart, epochIntervalEnd) => {
    let params = {
        KeyConditionExpression: '#type = :val and #interval BETWEEN :startInterval AND :endInterval',
        ExpressionAttributeNames: {
            '#type': 'Type',
            '#interval': 'Interval'
        },
        ExpressionAttributeValues: {
            ':val': type,
            ':startInterval': epochIntervalStart,
            ':endInterval': epochIntervalEnd
        },
        TableName: 'enpoweredCae'
    };
    return dynamodb.query(params).promise();
}

const errorResponse = (errorMessage, awsRequestId, callback) => {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}