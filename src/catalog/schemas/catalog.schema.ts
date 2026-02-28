import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";

export type CatalogDocument = HydratedDocument<Catalog>;
export type CatalogItemDocument = HydratedDocument<CatalogItem>;

/**
 * Nested document schema representing a single catalog item.
 * These are embedded within a `Catalog` document under `items`.
 */
@Schema({ _id: true })
export class CatalogItem {
    @Prop({ required: true, enum: CatalogType })
    type: CatalogType;

    // Item-specific name
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ required: true, enum: RarityType })
    rarity: RarityType;

    @Prop({ required: true, enum: UnlockType })
    unlockType: UnlockType;

    @Prop({ required: true, default: false })
    isRetired: boolean;

    @Prop({ required: true })
    version: number;

    @Prop({ required: false })
    styleRecipe: string;

    @Prop({ required: false})
    levelRequirement: number;

    @Prop({ required: false})
    isSkyboxed: boolean;

    @Prop({ type: Boolean, default: false })
    isAnimated: boolean;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

/**
 * Catalog schema represents a named catalog containing a list of items
 * and a catalog-level version that tracks updates to its item list.
 */
@Schema({ id: true, timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } })
export class Catalog {
    // Catalog-level name used to query a catalog document
    @Prop({ index: true, required: true, unique: true })
    name: string;

    // Catalog-level version sticking with the list of items
    @Prop({ required: true, default: 1 })
    version: number;

    // Embedded list of catalog items
    @Prop({ type: [CatalogItemSchema], default: [] })
    items: CatalogItem[];
}

export const CatalogSchema = SchemaFactory.createForClass(Catalog);
CatalogSchema.index({ name: 1 }, { unique: true });
