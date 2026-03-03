import { UserDTO } from './user.dto';

/**
 * DTO returned after a successful store purchase.
 */
export class PurchaseResponse {
    user: UserDTO;
    purchasedItemName: string;
    flipBucksSpent: number;
}
