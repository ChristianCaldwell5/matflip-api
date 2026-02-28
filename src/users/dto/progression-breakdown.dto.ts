import { BreakdownType } from "src/globals/enums/breakdown-types.enum";

export interface ProgressionBreakdown {
    type: BreakdownType;
    amount?: number;
    description?: string;
    toLevel?: number;
    multiplier?: number;
}
