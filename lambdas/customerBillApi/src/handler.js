const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const HOURLY_CUST_ID_TYPE_PREFIX = 'hourly_customer_';

exports.queryCustomerBill = (event, context, callback) => {
    console.log(JSON.stringify(event));

    // TODO vaidate query params "event.queryStringParameters.customerid"
    console.log(event.queryStringParameters);
    const { customerid, start, end } = event.queryStringParameters;

    const type = `${HOURLY_CUST_ID_TYPE_PREFIX}${parseInt(customerid).toString()}`;
    const epochIntervalStart = Date.parse(start)/1000;
    const epochIntervalEnd = (Date.parse(end)/1000);

    queryCustomerBill(type, epochIntervalStart, epochIntervalEnd).then(result => {
        const responeObject = result.Items.map(item => {
            return {
                customerId: customerid,
                intervalStart: epochToIsoDateString(item.Interval),
                intervalEnd: epochToIsoDateString(item.Interval + 3540),
                totalUsage: item.TotalUsage,
                costs: item.Costs
            };
        });
        callback(null, {
            statusCode: 200,
            body: JSON.stringify(responeObject),
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
    var params = {
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