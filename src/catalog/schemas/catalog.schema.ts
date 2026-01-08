import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { RarityType } from "src/globals/enums/rarity-types.enum";
import { UnlockType } from "src/globals/enums/unlock-types.enum";

export type CatalogDocument = HydratedDocument<Catalog>;
export type CatalogAuditDocument = HydratedDocument<CatalogAudit>;

/**
 * Mongoose schema for catalog items
 * Catalog items represent unlockable content in the game
 * @property type the type of catalog item
 * @property name the name of the catalog item
 * @property rarity the rarity level of the catalog item
 * @property unlockType the method by which the catalog item is unlocked
 * @property isRetired whether the catalog item is retired
 * @property version the version number of the catalog item
 * @property styleRecipe the style recipe associated with the catalog item
 */
@Schema({ id: true, timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } })
export class Catalog {
    @Prop({ required: true, enum: CatalogType })
    type: CatalogType;

    @Prop({ index: true, required: true })
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

    @Prop({ required: true })
    styleRecipe: string;

    @Prop({ type: Boolean, default: false })
    isAnimated: boolean;
}

/**
 * Mongoose schema for catalog audit
 * @property version the version number of the catalog
 * @property lastUpdated the timestamp of the last update
 */
export class CatalogAudit {
    @Prop({ required: true })
    version: number;

    @Prop({ required: true })
    lastUpdated: Date;
}

export const CatalogSchema = SchemaFactory.createForClass(Catalog);
CatalogSchema.index({ name: 1 }, { unique: true });

export const CatalogAuditSchema = SchemaFactory.createForClass(CatalogAudit);
