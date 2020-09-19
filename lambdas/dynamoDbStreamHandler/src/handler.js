'use strict';

const AWS = require('aws-sdk'); // TODO only import DynamoDB

AWS.config.region = 'eu-west-1'; // TODO switch to environment variable
console.debug('AWS Region:', AWS.config.region);

const dynamoDb = new AWS.DynamoDB();

exports.rollUpCustomerUsageData = function rollUpCustomerUsageData(event, context, callback) {
    console.log(JSON.stringify(event, null, 2));
    console.log('Writing ' + event.Records.length + ' records');
    event.Records.forEach(function(record) {
        console.log(record.eventID);
        console.log(record.eventName);
        console.log('DynamoDB Record: %j', record.dynamodb);
    });

    // writeItems(customerUsageData);
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