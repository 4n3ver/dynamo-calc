import DynamoMetrics, { DynamoMetricType } from "./dynamo-metrics"
import { average, sum } from "./util"

const ONE_MONTH_SECONDS = 30 * 24 * 3600

interface DynamoCapacity {
    tableName: string
    consumedRead: number
    consumedWrite: number
    provisionedRead: number
    provisionedWrite: number
}

class DynamoCapacityCalculator {
    private readonly dynamoMetrics: DynamoMetrics

    constructor(dynamoMetrics: DynamoMetrics) {
        this.dynamoMetrics = dynamoMetrics
    }

    async calculateCapacity(tableName: string, start: Date, period: number = ONE_MONTH_SECONDS): Promise<Readonly<DynamoCapacity>> {
        const consumedRead = await this.getSum(tableName, DynamoMetricType.ConsumedReadCapacityUnits, start, period)
        const consumedWrite = await this.getSum(tableName, DynamoMetricType.ConsumedWriteCapacityUnits, start, period)
        const provisionedRead = await this.getAverage(tableName, DynamoMetricType.ProvisionedReadCapacityUnits, start, period)
        const provisionedWrite = await this.getAverage(tableName, DynamoMetricType.ProvisionedWriteCapacityUnits, start, period)
        return {
            tableName,
            consumedRead,
            consumedWrite,
            provisionedRead,
            provisionedWrite
        }
    }

    private async getSum(tableName: string, metric: DynamoMetricType, start: Date, period: number): Promise<number> {
        const consumedMetric = await this.dynamoMetrics.retrieveMetric({
            tableName,
            metric,
            start,
            period,
            statistic: "Sum"
        })
        return consumedMetric.indicesMetric.flatMap(v => v.dataPoints)
            .map(d => d.Sum || 0)
            .reduce(sum, 0)
    }

    private async getAverage(tableName: string, metric: DynamoMetricType, start: Date, period: number): Promise<number> {
        const provisionedMetric = await this.dynamoMetrics.retrieveMetric({
            tableName,
            metric,
            start,
            period,
            statistic: "Average"
        })
        return provisionedMetric.indicesMetric.map(v => v.dataPoints)
            .map(ds => ds.map(d => d.Average || 0))
            .map(average)
            .reduce(sum, 0)
    }
}

export default DynamoCapacityCalculator
export {
    DynamoCapacity
}
