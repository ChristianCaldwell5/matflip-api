import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";
import { Catalog, CatalogDocument, CatalogItem } from "../schemas/catalog.schema";

export class CatalogItemDTO {
    type: CatalogType;
    name: string;
    displayName: string;
    rarity: RarityType;
    unlockType: UnlockType;
    isRetired: boolean;
    version: number;
    styleRecipe: string;
    levelRequirement?: number;
    flipBucksRequirement?: number;
    isSkyboxed?: boolean;
    isAnimated: boolean;

    private constructor(init: Partial<CatalogItemDTO>) {
        Object.assign(this, init);
    }

    static fromItem(item: CatalogItem): CatalogItemDTO {
        const raw: any = (item as any).toObject ? (item as any).toObject() : item;
        return new CatalogItemDTO({
            type: raw.type,
            name: raw.name,
            displayName: raw.displayName,
            rarity: raw.rarity,
            unlockType: raw.unlockType,
            isRetired: raw.isRetired,
            styleRecipe: raw.styleRecipe,
            levelRequirement: raw.levelRequirement,
            flipBucksRequirement: raw.flipBucksRequirement,
            isSkyboxed: raw.isSkyboxed,
            isAnimated: !!raw.isAnimated,
        });
    }
}

export class CatalogDTO {
    name: string;
    version: number;
    items: CatalogItemDTO[];

    constructor(init: Partial<CatalogDTO>) {
        Object.assign(this, init);
    }

    static fromCatalog(catalog: CatalogDocument | Catalog): CatalogDTO {
        if (!catalog) {
            throw new Error('Cannot map empty catalog to CatalogDTO');
        }
        const raw: any = (catalog as any).toObject ? (catalog as any).toObject() : catalog;
        return new CatalogDTO({
            name: raw.name,
            version: raw.version,
            items: Array.isArray(raw.items) ? raw.items.map((i: any) => CatalogItemDTO.fromItem(i)) : [],
        });
    }
}

export function toCatalogDTO(catalog: CatalogDocument | Catalog): CatalogDTO {
    return CatalogDTO.fromCatalog(catalog);
}

export function toCatalogItemDTO(item: CatalogItem): CatalogItemDTO {
    return CatalogItemDTO.fromItem(item);
}
