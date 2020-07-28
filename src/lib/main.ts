import { CloudWatch, config, DynamoDB, SharedIniFileCredentials } from "aws-sdk"
import { CommandLineOptions } from "command-line-args"

import DynamoMetrics from "./dynamo-metrics"
import DynamoCapacityCalculator, { DynamoCapacity } from "./dynamo-capacity-calculator"
import DynamoCostCalculator, { TableCapacityPricingPerUnit } from "./dynamo-cost-calculator"
import { collectPromises, resolvedPromiseOf, sum, withDelay } from "./util"

const COST: TableCapacityPricingPerUnit = {
    OnDemandRCU: 0.25 / 1000000,
    OnDemandWCU: 1.25 / 1000000,
    ProvisionedMonthlyRCU: 30 * 24 * 0.00013,
    ProvisionedMonthlyWCU: 30 * 24 * 0.00065,
}

async function main(args: CommandLineOptions) {
    const {
        tables: TABLE_NAMES,
        "start-date": START_DATE,
        region: REGION,
        profile: AWS_PROFILE
    } = args

    console.log(`Setting region to ${REGION}`)
    config.update({region: REGION})

    console.log(`Setting AWS shared credentials profile to ${AWS_PROFILE}`)
    config.credentials = new SharedIniFileCredentials({profile: AWS_PROFILE})

    const cloudwatch = new CloudWatch()
    const dynamoDB = new DynamoDB()

    const dynamoMetrics = new DynamoMetrics(cloudwatch)
    const dynamoCapacityCalculator = new DynamoCapacityCalculator(dynamoMetrics)

    console.log(`Using data starting from ${START_DATE.toLocaleString()}`)

    const tableNames = TABLE_NAMES.length > 0
        ? <string[]>TABLE_NAMES
        : (await dynamoDB.listTables().promise()).TableNames || []
    console.log(`Retrieving data from table(s): ${tableNames.join(", ")}`)

    const tableCapacities = await dynamoCapacityCalculator.calculateCapacities(tableNames, START_DATE)
    const tableCosts = tableCapacities.map(d => new DynamoCostCalculator(d, COST))

    console.log("")
    tableCosts.forEach(data => {
        console.log(data.tableName)
        console.log(`  Monthly usage:`)
        console.log(`    Consumed RCU: ${data.capacity.consumedRead} RCU`)
        console.log(`    Consumed WCU: ${data.capacity.consumedWrite} WCU`)
        console.log(`    Provisioned RCU: ${data.capacity.provisionedRead} RCU`)
        console.log(`    Provisioned WCU: ${data.capacity.provisionedWrite} WCU`)
        console.log(`  Estimated monthly cost:`)
        console.log(`    On-Demand Read: $${data.onDemandReadCost}`)
        console.log(`    On-Demand Write: $${data.onDemandWriteCost}`)
        console.log(`    Provisioned Read: $${data.provisionedReadCost}`)
        console.log(`    Provisioned Write: $${data.provisionedWriteCost}`)
        console.log("")
    })

    const shouldSwitchCostData = tableCosts.filter(costData => costData.onDemandSavings > 0)

    shouldSwitchCostData.forEach(costData => {
        console.log(`Switch table ${costData.tableName} to On-Demand to save $${costData.onDemandSavings} per month`)
    })

    const totalOnDemandSavings = shouldSwitchCostData.map(c => c.onDemandSavings).reduce(sum, 0)
    console.log("")
    console.log(`Total saved per month: $${totalOnDemandSavings}`)
}

export default main
