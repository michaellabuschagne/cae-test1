'use strict';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION;
// TODO implement logging framework
const dynamoDbClient = new AWS.DynamoDB();

const CONFIG = {
    TESTING: process.env.TESTING || false,
    DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'enpoweredCae'
};

exports.generateFakeEnergyData = function generateFakeEnergyData() {
    console.log('CONFIG', CONFIG);
    const epoch = generateEpoch();
    const energyData = generateEnergyRecord(epoch);
    console.debug('Writing energy data record' + JSON.stringify(energyData));
    writeItems([energyData]);
}

const writeItems = (energyPriceIntervals) => {
    energyPriceIntervals.forEach(energyPrice => {
        writeDynamoDbItem(energyPrice);
    });
};

const writeDynamoDbItem = energyPriceInterval => {
    const date = new Date();
    const type = `energy_price_${date.getUTCFullYear()}_${date.getUTCMonth()+1}_${date.getUTCDate()}_${date.getUTCHours()}`;
    const interval = new Date(energyPriceInterval.intervalStart).getTime().toString();
    const price = energyPriceInterval.price.toString();
    console.log(type, interval, price);
    const params = {
        Item: {
            Type: {
                S: type
            },
            Interval: {
                N: interval
            },
            Price: {
                N: price
            }
        },
        TableName: CONFIG.DDB_TABLE_NAME
    };

    // TODO implement mocking framework and remove testFlag
    if (CONFIG.TESTING) {
        console.log('Test mode enabled, not writing to DynamoDB')
        return;
    }
    
    dynamoDbClient.putItem(params).promise()
        .then(result => {
            console.log(`Successfuly wrote item ${JSON.stringify(params)}`);
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

const generateEnergyRecord = (epoch) => {
    return {
        intervalStart: epoch,
        intervalEnd: epoch + (5*60*1000),
        price: Math.random()
    };
    // This is the format in which data will be received
};