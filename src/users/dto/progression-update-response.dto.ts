import { ProgressionBreakdown } from "./progression-breakdown.dto";
import { UserDTO } from "./user.dto";

export class ProgressionUpdateResponse {
    user: UserDTO;
    breakdown: ProgressionBreakdown[];
}