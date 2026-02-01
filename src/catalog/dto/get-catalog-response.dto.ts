import { CatalogDTO, CatalogItemDTO } from "./catalog.dto";

/**
 * DTO for the response of getting catalog items
 * @extends CatalogDTO
 * @property requestedAt the timestamp when the request was made
 */
export class GetCatalogResponse extends CatalogDTO {
    requestedAt: Date;

    constructor(catalog?: CatalogDTO, requestedAt?: Date) {
        super(catalog || {});
        this.requestedAt = requestedAt || new Date();
    }
}
