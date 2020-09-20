# Assumptions
- S3 bucket with name ``cae-test1-deployment-artifacts`` already exists, created alternative bucket ``cae-test1-deployment-artifacts-mwl``. This does not have any bearing on the solution given it's an ephemeral data store used for deploying artefacts to Lambda.
- Only one energy pricing data record will be written per 5 minute interval as it can be used to calculate for any customer for the same time period. 

# Design decisions
## Interval times stored as Epoch
- Although the exercise specifically provides the date in the format ``2020-08-05T07:00:00Z`` it would be more appropriate to store the interval as an epoch in DynamoDB.
- Reasoning:
    - Firstly epochs can be stored as numbers, and therefore consume less space in the table and therefore will cost less (especially when considering the solution at scale).
    - Secondly, retrieval operations are more efficient when comparing numbers rather than strings.
- Assuming the devices generating and sending this data in that format are decoupled, and we could convert into epoch time at the point of data ingest.
## Not storing the interval end times
- Given that the interval end times can be inferred from the interval start times it may be better not store the intervalEnd to save on storage space.
- There are tradeoffs with this decision. For example, if the interval were to change in the future (e.g. from 5 minutes to 1 minute) the solution would need to be refactored to account for this. Ideally the tradeoffs would be thoroughly discussed and agreed upon based on and considering future roadmap items, business needs, and the likelihood of the interval changing.
## DynamoDB Table
### Partition Key
- A partition key ***Type*** was chosen to key the three types of data:
    - ***customer usage data*** (e.g. ``customer_1`` where 1 is the unique customer ID)
        - This ensures each customer's data can be stored in a separate shard
        - An additional consideration would be to add the year, month, and date as a suffix to increase the cardinality and ensure partitions do not become "hot" because of unbalanced access
    - ***energy pricing data*** (e.g. ``energy_price_2020_9_20``)
        - This data does not get written frequently (just once every 5 minutes) and can be cached and so partitions split by day should work
    - ***hourly customer usage data*** (e.g. ``hourly_customer_1`` where 1 is the unique customer ID)
        - This ensures each customer's data can be stored in a separate shard
        - Depending on the access patterns it may be better would be to add the year, month, and\or date as a suffix to increase the cardinality and ensure partitions do not become "hot" because of unbalanced access
### Sort Key
- A range key ***Interval*** was chosen to since it is common throughout the data
    - In the case of customer usage data and energy pricing data corresponding intervals can be used to calculate total customer costs for a given interval
    - In the case of hourly customer usage data it is used to start the start of a particular hourly interval
## Additional considerations
Below is a list of items that could be considered to address issues around performance, reliability, cost, security, and operational efficiency
##### Cost Optimization
- Test the solution at scale and determine the required DynamoDB RCU and WCU capacity required and consider purchasing reserved capacity
- Create an AWS budget with associated CloudWatch alarms to ensure costs are managed preemptively and to avoid bill shock
- Implement a tagging strategy to ensure costs can be easily managed for the solution
- Implement ElastiCache\ DAX as a write-through cache for Energy Pricing data to reduce the load on DynamoDB and therefore potentially save on costs
- Implement API Gateway caching to offload unnecessary repeated reads from DynamoDB (further investigation to assess how much cost savings)
- Implement batch writing to DynamoDB to reduce the Lambda execution time
##### Security
- Ensure encryption is implemented throughout the solution to ensure both customer and company data is adequately protected
- Introduce authentication\authorization to the API so that only authorized parties can view data
##### Operation Excellence\ Reliability
- Implement a consistent logging strategy for ERROR, INFO, and DEBUG logs to ensure the application can be easily supported
- Implement unit tests for NodeJS to prevent coding defects
- Implement SQS to ensure that hourly customer usage data that cannot be processed for any reason can be retried later
- Implement CloudFormation stacks or AWS CDK to make the template more manageable and easier to extend
- Implement static code analysis on the code base to reduce the amount of defects, security vulnerabilities, and performance and other issues
- Create CloudWatch Dashboards, Metrics, and Alarms to ensure that the health of the solution is constantly being monitored
- Create a model for all API resources\methods and ensure it is being used when integrating 
##### Performance Efficiency
- Limit the amount of data that customers can query ensure a better response latency (assuming this is possible depending on business requirements)

