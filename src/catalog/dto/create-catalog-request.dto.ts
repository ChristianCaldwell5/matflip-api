import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";

/**
 * DTO for creating (appending) a new catalog item into a specific catalog.
 * @property catalogName the target catalog document name to append into
 * @property type the type of catalog item
 * @property name the name of the catalog item
 * @property rarity the rarity level of the catalog item
 * @property unlockType the method by which the catalog item is unlocked
 * @property isRetired whether the catalog item is retired
 * @property styleRecipe the style recipe associated with the catalog item
 */
export class CreateCatalogRequest {
  catalogName: string;
  type: CatalogType;
  name: string;
  displayName: string;
  rarity: RarityType;
  unlockType: UnlockType;
  isRetired: boolean;
  styleRecipe: string;
  isAnimated?: boolean;
}
