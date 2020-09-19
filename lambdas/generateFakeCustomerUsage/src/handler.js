'use strict';

const AWS = require('aws-sdk'); // TODO only import DynamoDB

AWS.config.region = 'eu-west-1'; // TODO switch to environment variable
console.debug('AWS Region:', AWS.config.region);

const dynamoDb = new AWS.DynamoDB();

exports.generateFakeCustomerData = function generateFakeCustomerData() {
    const epoch = generateEpoch();
    const customerUsageData = generateItems(epoch);
    console.log('Writing ' + customerUsageData.length + ' records');
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
    console.log(type, interval, usage);
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
        TableName: 'enpoweredCae'
    };
    // TODO pass tablename as env var

    dynamoDb.putItem(params).promise()
        .then(result => {
            console.log(`Successfuly wrote item ${result}`);
        }).catch(error => {
            console.log(`Failed to write item ${error}`);
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
    for (let i = 1; i <= 1000; i++) {
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