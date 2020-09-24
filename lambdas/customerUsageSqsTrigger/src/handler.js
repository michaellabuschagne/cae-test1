'use strict';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION;
console.debug('AWS Region:', AWS.config.region);
// TODO implement logging framework
const dynamoDbClient = new AWS.DynamoDB();

const CONFIG = {
    TESTING: process.env.TESTING || false,
    DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'enpoweredCae'
};

const CUST_ID_TYPE_PREFIX = 'customer_';

exports.handleCustomerUsageDataIngest = function handleCustomerUsageDataIngest(event) {
    console.log('CONFIG', CONFIG);
    console.debug('Event data', JSON.stringify(event));
    processEventItems(event.Records);
}

function valid(message) {
    return true;
}

function processMessage(message) {
    if (valid(message.body)) {
        console.debug('Writing event message to DynamoDB');
        const customerUsage = JSON.parse(message.body);
        console.debug('body', customerUsage)
        writeDynamoDbItem(customerUsage);
        // TODO batch messages to DynamoDB
    } else {
        console.error('Invalid message, skipping', message);
    }
}

const processEventItems = (records) => {
    records.forEach(message => processMessage(message));
}

const writeDynamoDbItem = customerUsage => {
    const type = `${CUST_ID_TYPE_PREFIX}${customerUsage.customerId}`;
    const interval = getEpochFromStringDate(customerUsage.intervalStart);
    const usage = customerUsage.usage.toString();
    console.debug(type, interval, usage);
    const params = {
        Item: {
            Type: {
                S: type
            },
            Interval: {
                N: interval
            },
            Usage: {
                N: usage
            }
        },
        TableName: CONFIG.DDB_TABLE_NAME
    };

    // TODO implement mocking framework and remove testFlag
    if (CONFIG.TESTING) {
        console.log('Test mode enabled, not writing to DynamoDB')
        return;
    }

    // TODO implement batch writer
    dynamoDbClient.putItem(params).promise()
        .then(result => {
            console.debug(`Successfully wrote item ${JSON.stringify(params)}`);
        }).catch(error => {
        console.error(`Failed to write item ${error}`);
    });
}

const getEpochFromStringDate = (stringDate) => {
    const currentDate = new Date(stringDate);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    const epoch = currentDate.getTime()/1000;
    console.log(epoch);
    return epoch.toString();
}