import {
    Datapoint, Dimension,
    GetMetricStatisticsInput,
    ListMetricsInput,
    Period, Statistic
} from "aws-sdk/clients/cloudwatch"
import CloudWatch = require("aws-sdk/clients/cloudwatch")

import { collectPromises, resolvedPromiseOf } from "./util"

interface DynamoMetric {
    tableName: string
    metric: DynamoMetricType
    startTime: Date
    statistic: Statistic
    period: number
    indicesMetric: DynamoMetricDataPoints[]
}

interface DynamoMetricDataPoints {
    gsiName?: string
    dataPoints: Datapoint[]
}

interface DynamoMetricParam {
    tableName: string
    metric: DynamoMetricType
    statistic: Statistic
    start: Date
    period: Period
    periodCount?: number
}

enum DynamoMetricType {
    ProvisionedReadCapacityUnits = "ProvisionedReadCapacityUnits",
    ConsumedReadCapacityUnits = "ConsumedReadCapacityUnits",
    ProvisionedWriteCapacityUnits = "ProvisionedWriteCapacityUnits",
    ConsumedWriteCapacityUnits = "ConsumedWriteCapacityUnits"
}

class DynamoMetrics {
    private readonly cloudwatch: CloudWatch

    constructor(cloudwatch: CloudWatch) {
        this.cloudwatch = cloudwatch
    }

    async retrieveMetric(param: DynamoMetricParam): Promise<Readonly<DynamoMetric>> {
        const metrics = await this.listMetrics(param.tableName, param.metric)

        return {
            tableName: param.tableName,
            metric: param.metric,
            startTime: param.start,
            statistic: param.statistic,
            period: param.period,
            indicesMetric: await metrics.map(m => m.Dimensions || [])
                .map(d => this.retrieveMetricWithDimension(param, d))
                .reduce(collectPromises, resolvedPromiseOf(<DynamoMetricDataPoints[]>[]))
        }
    }

    async retrieveMetricWithDimension(param: DynamoMetricParam, dimensions: CloudWatch.Dimension[]): Promise<Readonly<DynamoMetricDataPoints>> {
        const req = <GetMetricStatisticsInput>{
            StartTime: param.start,
            EndTime: new Date(param.start.valueOf() + (param.periodCount || 1) * param.period * 1000),
            MetricName: param.metric,
            Namespace: "AWS/DynamoDB",
            Period: param.period,
            Statistics: [param.statistic],
            Dimensions: dimensions
        }

        const datapoints = await this.cloudwatch.getMetricStatistics(req).promise()
            .then(res => res.Datapoints || [])

        return {
            gsiName: (dimensions.find(d => d.Name === "GlobalSecondaryIndexName") || <Dimension>{}).Value,
            dataPoints: datapoints
        }
    }

    listMetrics(tableName: string, metric: DynamoMetricType): Promise<Readonly<CloudWatch.Metric[]>> {
        const req = <ListMetricsInput>{
            Namespace: "AWS/DynamoDB",
            MetricName: metric,
            Dimensions: [
                {
                    Name: "TableName",
                    Value: tableName
                }
            ]
        }
        return this.cloudwatch.listMetrics(req).promise()
            .then(res => res.Metrics || [])
    }
}

export default DynamoMetrics
export {
    DynamoMetric,
    DynamoMetricType
}
