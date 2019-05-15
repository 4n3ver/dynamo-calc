# dynamo-calc

  Calculate your DynamoDB capacity usages for the past month and compare the
  cost between 'Provisioned' and 'On-Demand' billing mode

Usage
------

  `$ dynamo-calc --tables TableA TableB --region us-west-1 --profile test`

Options
------
  options           | description
  ---               | --- 
  `--tables`        | Dynamo tables to process, default to all tables.|
  `--start-date`    | Start date of a past month period to calculate, default to 30 days before now
  `--region`        | AWS region to use, default to 'us-east-1'
  `--profile`       | AWS shared credential profile to use, default to 'default' profile.
  `--help`          | Print this usage guide.
