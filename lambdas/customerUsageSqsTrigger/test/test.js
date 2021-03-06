const handleCustomerUsageDataIngest = require('../src/handler').handleCustomerUsageDataIngest;
// TODO implement mocking framework -- https://mochajs.org/
// TODO load data from file
exports.test = () => {
    const testEvent = JSON.parse('{"Records":[{"messageId":"fde3a679-65d3-407c-8898-eb6532723775","receiptHandle":"AQEBAiQQJpTYERP8aNFXps7YdWVqu3aNwvC5FOG/3KJFmORNrADHfhcbQyqZOTdgfafKErhBJNlvxKExng1GKmn0mtcduXoi4uLptibrH4f3a+iI1BHp4KlM1qSLvqI548o5vqVKVM1cpRORA/BZG/M842ZixSkh1ZCC1OAz/Z3MGNYLkGw8o/hHFL3mrGsOw9XZXtyhX1j/o2ZfKGknTYqE6osq3sGA+En/3vlLHU6F+Aimc+YIlQJcMgm+EztHVXl4TVTAl/MqR3Qwo/tv+SRcHwTbVyJtGydIKwq0D0LjafouuW+g5DWl9u/guHu5OAwdfW/QpnARpu+E71F6ufv+YepKHCPisWE9hoModgF3KAjl7b1Ox9iRTCAFyFJTLmXX86ovLK1L/I4u08H7Y8T/Ww==","body":"{\\n  \\"customerId\\": 5,\\n  \\"intervalStart\\": \\"2020-08-05T00:00:00Z\\",\\n  \\"intervalEnd\\" : \\"2020-08-05T00:05:00Z\\",\\n  \\"usage\\": 500\\n}","attributes":{"ApproximateReceiveCount":"1","AWSTraceHeader":"Root=1-5f6c7762-a63ae591ca746486a4e4d8d6","SentTimestamp":"1600943970810","SenderId":"AROAXSLHLHWYH6NWFWKWX:BackplaneAssumeRoleSession","ApproximateFirstReceiveTimestamp":"1600943970814"},"messageAttributes":{},"md5OfBody":"8ec49a42bcab6f26821db3cbb246a5e4","eventSource":"aws:sqs","eventSourceARN":"arn:aws:sqs:af-south-1:520444657072:CustomerUsageData","awsRegion":"af-south-1"}]}');

    handleCustomerUsageDataIngest(testEvent);
}