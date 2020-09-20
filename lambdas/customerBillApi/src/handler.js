'use strict';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION;
console.debug('AWS Region:', AWS.config.region);
// TODO implement logging framework
const dynamodbClient = new AWS.DynamoDB.DocumentClient();

const CONFIG = {
    TESTING: process.env.TESTING || false,
    DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'enpoweredCae'
};

const HOURLY_CUST_ID_TYPE_PREFIX = 'hourly_customer_';
const MINUTES_59_SECONDS = 3540;

exports.queryCustomerBill = (event, context, callback) => {
    console.log(JSON.stringify(event));
    console.log('CONFIG', CONFIG);
    // TODO validate query params "event.queryStringParameters.customerid"
    console.debug(event.queryStringParameters);
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
                intervalEnd: epochToIsoDateString(item.Interval + MINUTES_59_SECONDS),
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
        TableName: CONFIG.DDB_TABLE_NAME
    };

    // TODO implement mocking framework and remove testFlag
    if (CONFIG.TESTING) {
        console.log('Test mode enabled, not querying DynamoDB');
        return new Promise((resolve, reject) => resolve({Items:[]}));
    }

    return dynamodbClient.query(params).promise();
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