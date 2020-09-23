'use strict';

const AWS = require('aws-sdk');
AWS.config.region = process.env.AWS_REGION;
console.debug('AWS Region:', AWS.config.region);
// TODO implement logging framework -- https://www.npmjs.com/package/lambda-log
const dynamoDbClient = new AWS.DynamoDB();

const CONFIG = {
    TESTING: process.env.TESTING || false,
    DDB_TABLE_NAME: process.env.DDB_TABLE_NAME || 'enpoweredCae'
};

const CUST_ID_TYPE_PREFIX = 'customer';
const ENERGY_PRICE_TYPE_PREFIX = 'energy_price';
const DDB_INSERT_EVENT_NAME = 'INSERT';
const HOURLY_CUST_ID_TYPE_PREFIX = 'hourly_';


exports.rollUpCustomerUsageData = function rollUpCustomerUsageData(event) {
    console.log('CONFIG', CONFIG);
    try {
        console.debug(JSON.stringify(event, null, 2));
        processEventData(event.Records);
    } catch (error) {
        // TODO Write data to SQS dead letter queue for reprocessing
        console.error(error);
    }
}

const processEventData = (records) => {
    const initialMap = new Map();
    initialMap.set(CUST_ID_TYPE_PREFIX, new Map());
    initialMap.set(ENERGY_PRICE_TYPE_PREFIX, new Map());

    const custUsgEnrgyPrcMap = records
        .reduce((acc, item) => {
            if (item.eventName !== DDB_INSERT_EVENT_NAME) {
                console.debug(`Ignoring ${item.eventName}`);
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
    console.debug(custUsgEnrgyPrcMap.get(CUST_ID_TYPE_PREFIX));

    const custHourlyUsageMap = new Map();
    for (const [customerId, usageArr] of custUsgEnrgyPrcMap.get(CUST_ID_TYPE_PREFIX)) {
        usageArr.reduce((acc, usageItem) => {
            const { interval, usage } = usageItem;
            const epochHourInterval = truncEpochToHour(interval);
            const key = `${customerId}_${epochHourInterval}`;
            let energyPrice = 0;
            if (!custUsgEnrgyPrcMap.get(ENERGY_PRICE_TYPE_PREFIX).has(interval)) {
                console.error(`Energy Price for interval ${interval} not available`);
                // TODO fix design issue where assumption was energy price
                // TODO for the needed intervals will always be in the stream data
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
    console.debug(custHourlyUsageMap);
    writeItems(custHourlyUsageMap);
}

const processCustomerUsageData = (acc, newImage) => {
    const { Type : { S : customerId }, Usage : { N : usage }, Interval : { N : interval} } = newImage;
    const customerUsageMap = acc.get(CUST_ID_TYPE_PREFIX);
    const usageInt = parseFloat(usage);
    customerUsageMap.has(customerId)
        ? customerUsageMap.get(customerId).push({usage: usageInt, interval})
        : customerUsageMap.set(customerId, [{usage: usageInt, interval}]);
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
            console.error(`Failed to write data, continuing to next record ${error}`);
        }
    });
};

const writeDynamoDbItem = custHourlyUsageItem => {
    const type = `${HOURLY_CUST_ID_TYPE_PREFIX}${custHourlyUsageItem.customerId}`;
    const interval = custHourlyUsageItem.interval.toString();
    const totalUsage = custHourlyUsageItem.totalUsage.toString();
    const costs = custHourlyUsageItem.costs.toString();
    console.debug(type, interval, totalUsage, costs);
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
        TableName: CONFIG.DDB_TABLE_NAME
    };

    // TODO implement mocking framework and remove testFlag -- https://mochajs.org/
    if (CONFIG.TESTING) {
        console.log('Test mode enabled, not writing to DynamoDB')
        return;
    }

    dynamoDbClient.putItem(params).promise()
        .then(result => {
            console.log(`Successfully wrote item ${JSON.stringify(params.Item)}`);
        }).catch(error => {
            console.error(`Failed to write item ${JSON.stringify(params.Item)} Error:${error}`);
        });
    // TODO write items as a batch
}