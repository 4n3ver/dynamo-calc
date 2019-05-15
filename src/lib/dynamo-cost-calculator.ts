import { DynamoCapacity } from "./dynamo-capacity-calculator"
import { Memoized } from "./util"

interface TableCapacityPricingPerUnit {
    OnDemandRCU: number,
    OnDemandWCU: number,
    ProvisionedMonthlyRCU: number,
    ProvisionedMonthlyWCU: number
}

class DynamoCostCalculator {
    readonly tableName: string
    readonly capacity: DynamoCapacity
    readonly pricing: TableCapacityPricingPerUnit

    constructor(capacity: DynamoCapacity, pricing: TableCapacityPricingPerUnit) {
        this.tableName = capacity.tableName
        this.capacity = capacity
        this.pricing = pricing
    }

    @Memoized()
    get onDemandReadCost(): number {
        return this.capacity.consumedRead * this.pricing.OnDemandRCU
    }

    @Memoized()
    get onDemandWriteCost(): number {
        return this.capacity.consumedWrite * this.pricing.OnDemandWCU
    }

    @Memoized()
    get provisionedReadCost(): number {
        return this.capacity.provisionedRead * this.pricing.ProvisionedMonthlyRCU
    }

    @Memoized()
    get provisionedWriteCost(): number {
        return this.capacity.provisionedWrite * this.pricing.ProvisionedMonthlyWCU
    }

    @Memoized()
    get onDemandSavings(): number {
        return (this.provisionedReadCost + this.provisionedWriteCost)
            - (this.onDemandReadCost + this.onDemandWriteCost)
    }
}

export {
    TableCapacityPricingPerUnit,
    DynamoCostCalculator
}
