# CAE EnPowered


Hey there!

Thank you so much for taking the time to check this out — we appreciate your
time.

We'd like you to show us a bit of what you can do by completing a short
exercise. It's nothing major, and should not take you long, but we'd like to give
you room to blow us away. We require that you make a submission within a
specific time frame, whilst leaving you room to improve on the first
submission over an extended period. Just to be clear, you do not have to spend
too much time on it. We just want you to deliver simple, clean and, idomatic code
in a well organized form.

## How to do the exercise

Fork this repository to your github profile, do the exercise and then send a
link to your repository in an email message to veteran@en-powered.com with the
subject "``cae-test1``".

You can have as many commits as you would like, but after completing the exercise
to our basic specifications, commit your code with the commit message:

"``Submission1``"

This would allow us know which one of the commits you want to be evaluated on.
You should do this by noon on Saturday.

After this, if you want to show us more of what you can do by improving on your
first submission, work on it some more and then make another commit with the
message "``beyond-the-call``"
request. You can do this any time before midnight on Sunday. We will not
consider any submission after midnight on Sunday.

## The Exercise

The objective of this exercise is to implement an application that:

1. generates fake energy usage records for 1000 customers every 5 minutes and
   writes them to a dynamodb table named ``cae-test1``
2. Generates fake energy prices every 5 minutes and writes them to the same
   table - ``cae-test1``
3. Calculates each customer's hourly energy cost and writes them to the table
   ``cae-test1``
4. Provides a HTTP endpoint to query a customer's bill by id and date bounds in


In this repository, you will find 2 files and one directory.
- package.json
- cae-test1.cf.json
- lambdas

We have placed some entries in the ``scripts`` section of the ``package.json``
files so that invoking ``npm run deploy`` will deploy the application to the
cloud. You do need to create an s3 bucket called ``cae-test1-deployment-artifacts``
before attempting to run that command.

Place all your cloudformation resource definitions into ``cae-test1.cf.json``.

Your lambda function code and their direct dependencies should go into the
folder ``lambdas``. Dependencies will include the npm packages and custom
scripts that your application will require.

# Key specifications and constraints

- Customers should have a unique identifier that is a number between 1 and 1000
- Energy usage is a numeric value accrued to an interval, so the application 
  should generate fake usage records illustrated by the example:
    ```
    {
      "customerId": 5,
      "intervalStart": "2020-08-05T00:00:00Z",
      "intervalEnd" : "2020-08-05T00:05:00Z",
      "usage": 500
   }
   ```
- Assume that energy prices are a simple floating point value always less than
    1.0. So the application should generate price information records of the form:
    ```
    {
      "intervalStart": "2020-08-05T00:00:00Z",
      "intervalEnd" : "2020-08-05T00:05:00Z",
      "price": 0.05
   }
   ```
- The application should support the required query by responding to a http GET
    call to a url of the form:
    ```
    http://<api-gateway-url-for-application>/stage/<path-to-hourly-usage-and-cost-query>?customerid=005&start=2020-08-05T05:00:00Z&end=2020-08-05T07:00:00Z
    ```
    With an array of hourly costs of like:
    ```
    [
      {
        "customerId": 5,
        "intervalStart": "2020-08-05T05:00:00Z",
        "intervalEnd" : "2020-08-05T05:59:00Z",
        "totalUsage" : 2600,
        "costs": 13
      },
      {
        "customerId": 5,
        "intervalStart": "2020-08-05T06:00:00Z",
        "intervalEnd" : "2020-08-05T06:59:00Z",
        "totalUsage" : 2600,
        "costs": 13
      },
      {
        "customerId": 5,
        "intervalStart": "2020-08-05T07:00:00Z",
        "intervalEnd" : "2020-08-05T07:59:00Z",
        "totalUsage" : 2600,
        "costs": 13
      }
   ]
   ```
- Do *NOT* use a framework like Serverless or a tool like Terraform for this 
  exercise. We'd also prefer that you avoid AWS SAM. Your code must be written
  in plain Javascript and with JSON or Yaml for cloudformation templates.
  However, feel free to install any NPM packages you'd like as long as the
  entire applicationn be deployed to the cloud with the command ``npm run
  deploy``“
- The application should not require any other means to deploy it save for 
  creating a bucket named ``cae-test1-deployment-artifacts`` and then running 
  ``npm run deploy``. So all resources including the dynmodb table should be
  created using cloudformation

# Other considerations

- Adopt a consistent Javascript code style.
- If there is any thing you would want us to know about your work write it in a 
   file called ``implementation.md``. For instance it would be useful to
   describe your Partition and Sort key schema in that document.
- Feel free to use OpenApi3 to define your HTTP api. You can just place your
    OpenAPI spec in a file called ``cae-test1.openapi.yaml``.
- You should consider using dynamodb streams for computing the hourly interval
    costs.

# Asking Questions

We are happy to answer questions but would prefer that you make assumptions and
move forward. Later, if asked, stand by your choices and defend them. If you do
choose to ask questions, please send an email to veteran@en-powered.com eh!
