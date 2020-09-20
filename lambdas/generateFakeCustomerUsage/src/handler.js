'use strict';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION;
console.debug('AWS Region:', AWS.config.region);
// TODO implement logging framework
const dynamoDbClient = new AWS.DynamoDB();

const CONFIG = {
    TESTING: process.env.TESTING || false,
    DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'enpoweredCae',
    CUSTOMER_ROWS: Number(process.env.CUSTOMER_ROWS || 1)
};

exports.generateFakeCustomerData = function generateFakeCustomerData() {
    console.log('CONFIG', CONFIG);
    const epoch = generateEpoch();
    const customerUsageData = generateItems(epoch);
    console.debug('Writing ' + customerUsageData.length + ' records');
    writeItems(customerUsageData);
}

const writeItems = (customerUsageArray) => {
    customerUsageArray.forEach(usage => {
        writeDynamoDbItem(usage);
    });
};

const writeDynamoDbItem = customerUsage => {
    const type = `customer_${customerUsage.customerId}`;
    const interval = new Date(customerUsage.intervalStart).getTime().toString();
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

const generateEpoch = () => {
    const currentDate = new Date();
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    const epoch = currentDate.getTime()/1000;
    console.log(epoch);
    return epoch;
}

const generateItems = (epoch) => {
    const customerUsageData = [];
    for (let i = 1; i <= CONFIG.CUSTOMER_ROWS; i++) {
        customerUsageData.push({
            customerId: i,
            intervalStart: epoch,
            intervalEnd: epoch + (5*60*1000),
            usage: Math.floor(Math.random() * 1000)
        });
        // This is the format in which data will be received by remote clients
    }
    return customerUsageData;
}