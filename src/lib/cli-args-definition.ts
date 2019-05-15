const MONTH_IN_MILLIS = 30 * 24 * 3600 * 1000
const A_MONTH_AGO = new Date(Date.now() - MONTH_IN_MILLIS)

const cliGuide = [
    {
        header: "dynamo-calc",
        content: "Calculate your DynamoDB capacity usages for the past month and compare the cost between 'Provisioned' and 'On-Demand' billing mode"
    },
    {
        header: "Usage",
        content: "dynamo-calc --tables TableA TableB --region us-west-1 --profile test"
    },
    {
        header: "Options",
        optionList: [
            {
                name: "tables",
                description: "Dynamo tables to process, default to all tables."
            }, {
                name: "start-date",
                description: "Start date of a past month period to calculate, default to 30 days before now"
            }, {
                name: "region",
                description: "AWS region to use, default to 'us-east-1'"
            }, {
                name: "profile",
                description: "AWS shared credential profile to use, default to 'default' profile."
            }, {
                name: "help",
                description: "Print this usage guide."
            }
        ]
    }
]

const cliDef = [
    { name: "tables", type: String, multiple: true, defaultValue: [] },
    { name: "start-date", type: Date, defaultValue: A_MONTH_AGO },
    { name: "region", type: String, defaultValue: "us-east-1" },
    { name: "profile", type: String, defaultValue: "default" },
    { name: "help", type: Boolean, defaultValue: false }
]

export {
    cliGuide,
    cliDef
}
