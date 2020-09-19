'use strict';

const AWS = require('aws-sdk'); // TODO only import DynamoDB

AWS.config.region = 'eu-west-1'; // TODO switch to environment variable
console.debug('AWS Region:', AWS.config.region);

const dynamoDb = new AWS.DynamoDB();

const CUST_ID_TYPE_PREFIX = 'customer';
const ENERGY_PRICE_TYPE_PREFIX = 'energy_price';
const DDB_INSERT_EVENT_NAME = 'INSERT';

exports.rollUpCustomerUsageData = function rollUpCustomerUsageData(event, context, callback) {
    try {
        console.log(JSON.stringify(event, null, 2));
        processEventData(event.Records);
    } catch (error) {
        console.log(error);
    }
}

const processEventData = (records) => {
    const initialMap = new Map();
    initialMap.set(CUST_ID_TYPE_PREFIX, new Map());
    initialMap.set(ENERGY_PRICE_TYPE_PREFIX, new Map());

    const custUsgEnrgyPrcMap = records
        .reduce((acc, item) => {
            if (item.eventName !== DDB_INSERT_EVENT_NAME) {
                console.log(`Ignoring ${item.eventName}`);
                return acc;
            }
            const newImage = item.dynamodb.NewImage;
            const type = item.dynamodb.NewImage.Type.S;
            if (type.startsWith(CUST_ID_TYPE_PREFIX)) {
                processCustomerUsageData(acc, newImage);
            } else if (type.startsWith(ENERGY_PRICE_TYPE_PREFIX)) {
                const { Price : { N : price }, Interval : { N : interval } } = newImage;
                const energyPriceMap = acc.get(ENERGY_PRICE_TYPE_PREFIX);
                energyPriceMap.set(interval, parseFloat(price));
            }
            return acc;
        }, initialMap);
    console.log(custUsgEnrgyPrcMap.get(CUST_ID_TYPE_PREFIX));

    const custHourlyUsageMap = new Map();
    for (const [customerId, usageArr] of custUsgEnrgyPrcMap.get(CUST_ID_TYPE_PREFIX)) {
        usageArr.reduce((acc, usageItem) => {
            const { interval, usage } = usageItem;
            const epochHourInterval = truncEpochToHour(interval);
            const key = `${customerId}_${epochHourInterval}`;
            let energyPrice = 0;
            if (!custUsgEnrgyPrcMap.get(ENERGY_PRICE_TYPE_PREFIX).has(interval)) {
                console.log(`Enery Price for interval ${interval} not available`);
            } else {
                energyPrice = custUsgEnrgyPrcMap.get(ENERGY_PRICE_TYPE_PREFIX).get(interval);
            }
            if (acc.has(key)) {
                let { totalUsage, costs } = acc.get(key);
                totalUsage+=usage;
                costs+=(energyPrice*usage);
                acc.set(key, {customerId, totalUsage, costs, interval: epochHourInterval});
            } else {
                acc.set(key, {customerId, totalUsage: usage , costs: energyPrice*usage, interval: epochHourInterval});
            }
            return acc;
        }, custHourlyUsageMap);
    }
    console.log(custHourlyUsageMap);
    writeItems(custHourlyUsageMap);
}

const processCustomerUsageData = (acc, newImage) => {
    const { Type : { S : customerId }, Usage : { N : usage }, Interval : { N : interval} } = newImage;
    const cutomerUsageMap = acc.get(CUST_ID_TYPE_PREFIX);
    const usageInt = parseFloat(usage);
    cutomerUsageMap.has(customerId)
        ? cutomerUsageMap.get(customerId).push({usage: usageInt, interval})
        : cutomerUsageMap.set(customerId, [{usage: usageInt, interval}]);
}

const truncEpochToHour = (epoch) => {
    const date = new Date(epoch*1000);
    date.setSeconds(0);
    date.setMinutes(0);
    return date.getTime()/1000;
}

const writeItems = (custHourlyUsageMap) => {
    custHourlyUsageMap.forEach(usage => {
        try {
            writeDynamoDbItem(usage);
        } catch (error) {
            console.log(`Failed to write data, continuing to next record ${error}`);
        }
    });
};

const writeDynamoDbItem = custHourlyUsageItem => {
    const type = `hourly_${custHourlyUsageItem.customerId}`;
    const interval = custHourlyUsageItem.interval.toString();
    const totalUsage = custHourlyUsageItem.totalUsage.toString();
    const costs = custHourlyUsageItem.costs.toString();
    console.log(type, interval, totalUsage, costs);
    const params = {
        Item: {
            Type: {
                S: type
            },
            Interval: {
                N: interval
            },
            TotalUsage: {
                N: totalUsage
            },
            Costs: {
                N: costs
            }
        },
        TableName: 'enpoweredCae'
    };
    // TODO pass tablename as env var

    dynamoDb.putItem(params).promise()
        .then(result => {
            console.log(`Successfuly wrote item ${JSON.stringify(params.Item)}`);
        }).catch(error => {
            console.log(`Failed to write item ${JSON.stringify(params.Item)} Error:${error}`);
        });
    // TODO write items as a batch
}