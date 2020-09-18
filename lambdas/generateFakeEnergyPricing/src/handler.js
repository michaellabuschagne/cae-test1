'use strict';

const aws = require('aws-sdk'); // TODO only import DynamoDB

aws.config.region = 'eu-west-1'; // TODO switch to environment variable

const dynamoDbClient = new aws.DynamoDB();

exports.generateFakeEnergyData = function generateFakeEnergyData() {
    const epoch = generateEpoch();
    const energyData = generateEnergyRecord(epoch);
    console.log('Writing energy data record' + JSON.stringify(energyData));
    writeItems([energyData]);
}

const writeItems = (energyPriceIntervals) => {
    energyPriceIntervals.forEach(energyPrice => {
        writeDynamoDbItem(energyPrice);
    });
};

const writeDynamoDbItem = energyPriceInterval => {
    const date = new Date();
    const type = `energy_price_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}`;
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
        TableName: 'enpoweredCae'
    };

    dynamoDbClient.putItem(params).promise()
        .then(result => {
            console.log(`Successfuly wrote item ${JSON.stringify(result)}`);
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