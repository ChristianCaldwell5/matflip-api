/**
 * DTO for a store purchase request.
 * @property catalogName the catalog to look up the item in (e.g. 'default')
 * @property itemName   the unique `name` of the catalog item to purchase
 */
export class PurchaseRequest {
    catalogName!: string;
    itemName!: string;
}
