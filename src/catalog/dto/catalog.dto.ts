import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";
import { Catalog, CatalogDocument } from "../schemas/catalog.schema";

export class CatalogDTO {
    id: string;
    type: CatalogType
    name: string;
    displayName: string;
    rarity: RarityType
    unlockType: UnlockType;
    isRetired: boolean
    version: number;
    styleRecipe: string;
    isAnimated: boolean;

    private constructor(init: Partial<CatalogDTO>) {
        Object.assign(this, init);
    }

    // Factory that safely converts a mongoose document or plain object into DTO
    static fromCatalog(catalog: CatalogDocument | Catalog) : CatalogDTO {
        if (!catalog) {
            throw new Error('Cannot map empty catalog to CatalogDTO');
        }
        // If it's a mongoose document prefer toObject for lean copy
        const raw: any = (catalog as any).toObject ? (catalog as any).toObject() : catalog;
        return new CatalogDTO({
            id: raw._id ? String(raw._id) : undefined,
            type: raw.type,
            name: raw.name,
            displayName: raw.displayName,
            rarity: raw.rarity,
            unlockType: raw.unlockType,
            isRetired: raw.isRetired,
            version: raw.version,
            styleRecipe: raw.styleRecipe,
            isAnimated: raw.isAnimated,
        });
    }
}

export function toCatalogDTO(catalog: CatalogDocument | Catalog): CatalogDTO {
  return CatalogDTO.fromCatalog(catalog);
}
