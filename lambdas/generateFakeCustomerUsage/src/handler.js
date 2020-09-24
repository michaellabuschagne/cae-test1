'use strict';

// TODO implement logging framework

const axios = require('axios');

const CONFIG = {
    TESTING: process.env.TESTING || false,
    CUSTOMER_ROWS: Number(process.env.CUSTOMER_ROWS || 1),
    CUSTOMER_USAGE_URL: process.env.CUSTOMER_USAGE_URL
};

exports.generateFakeCustomerData = function generateFakeCustomerData() {
    console.log('CONFIG', CONFIG);
    const epoch = generateEpoch();
    const customerUsageData = generateItems(epoch);
    console.debug('Writing ' + customerUsageData.length + ' records');
    sendItemsToCustomerUsageApi(customerUsageData);
}

const sendItemsToCustomerUsageApi = (customerUsageArray) => {
    // TODO implement mocking framework and remove testFlag
    if (CONFIG.TESTING) {
        console.log(JSON.stringify(customerUsageArray));
        console.log('Test mode enabled, not calling API gateway')
        return;
    }
    customerUsageArray.forEach(usage => {
        sendItemToCustomerUsageApi(usage);
    });
};

const sendItemToCustomerUsageApi = customerUsage => {

    axios.post(CONFIG.CUSTOMER_USAGE_URL, customerUsage)
        .then(res => {
            // console.trace(`statusCode: ${res.statusCode}`)
            // TODO implement logging framework to better control logging level
        }).catch(error => {
            console.error('API call failed', error);
        });
}

const generateEpoch = () => {
    const currentDate = new Date();
    currentDate.setUTCSeconds(0);
    currentDate.setUTCMilliseconds(0);
    // Round the minute to the nearest 5 minutes to ensure intervals match energy price intervals
    currentDate.setUTCMinutes(Math.ceil(currentDate.getUTCMinutes()/5)*5);
    return currentDate.getTime()/1000;
}

const generateStringDateFromEpoch = (epoch) => {
    const date = new Date(epoch*1000);
    //console.trace(epoch, date.toISOString());
    return date.toISOString();
}

const generateItems = (epoch) => {
    const customerUsageData = [];
    for (let i = 1; i <= CONFIG.CUSTOMER_ROWS; i++) {
        customerUsageData.push({
            customerId: i,
            intervalStart: generateStringDateFromEpoch(epoch),
            intervalEnd: generateStringDateFromEpoch(epoch + (5*60)),
            usage: Math.floor(Math.random() * 1000)
        });
        // This is the format in which data will be received by remote clients
    }
    return customerUsageData;
}