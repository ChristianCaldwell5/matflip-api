import { CatalogDTO } from "./catalog.dto";

/**
 * DTO for the response of getting catalog items
 * @property catalogItems the list of catalog items
 * @property version the version number of the catalog
 * @property requestedAt the timestamp when the request was made
 */
export class GetCatalogResponse {
    catalogItems: CatalogDTO[];
    version: number;
    requestedAt: Date;
}
