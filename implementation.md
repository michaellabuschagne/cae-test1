# Assumptions
- S3 bucket with name ``cae-test1-deployment-artifacts`` already exists, created alternative bucket ``cae-test1-deployment-artifacts-mwl``. This does not have any bearing on the solution given it's an ephemeral data store used for deploying artefacts to Lambda.
- For the API Gateway query ``GET customer bill by ID and date bounds`` a starting hour of ``05:00`` and an ending hour of ``07:00`` is provided in the sample API call. The data returned includes, for the first item, an ``intervalStart`` time of ``05:00`` and the last item an ``intervalEnd`` time of ``07:59:00``. Thus it can be concluded that the ``end`` query paramater will signify the start of the hour.
- DynamoDB table will be write heavy and read light (reads can be aggressively cache)

# Design decisions
## Interval times stored as Epoch
- Although the exercise specifically provides the date format in Zulu Time it would be more appropriate to store the interval as an epoch in DynamoDB.
- Firstly epochs can be stored as numbers, and therefore consume less space in the table and this less cost.
- Secondly, retrieval operations are more efficient when comparing numbers rather than strings.
- Assuming the devices generating and sending this data in that format are decoupled and we could convert into epoch time at the point of data ingest.
## Not storing the interval end times
- Given that the interval end times can be inferred from the interval start times it may be better not store to save storage space.
- Understandably there are tradeoffs with this decision as if the interval were to change in the future (e.g. from 5 minutes to 1 minute) the solution would need to be refactored to account for this. Ideally the tradeoffs would be thoroughly discussed and agreed upon based on and considering future roadmap items, business needs, and the likelihood of the interval changing.

