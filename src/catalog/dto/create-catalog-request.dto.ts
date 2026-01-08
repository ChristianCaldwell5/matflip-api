import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";

/**
 * DTO for creating a new catalog item
 * @property type the type of catalog item
 * @property name the name of the catalog item
 * @property rarity the rarity level of the catalog item
 * @property unlockType the method by which the catalog item is unlocked
 * @property isRetired whether the catalog item is retired
 * @property version the version number of the catalog item
 * @property styleRecipe the style recipe associated with the catalog item
 */
export class CreateCatalogRequest {
  type: CatalogType;
  name: string;
  displayName: string;
  rarity: RarityType;
  unlockType: UnlockType;
  isRetired: boolean;
  version: number;
  styleRecipe: string;
  isAnimated?: boolean;
}
