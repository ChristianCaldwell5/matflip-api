import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Catalog, CatalogItem, CatalogItemSchema } from "src/catalog/schemas/catalog.schema";

@Schema({ _id: false })
export class CurrentCustomizationSelects {
    @Prop({ required: true, type: CatalogItemSchema, default: null, nullable: true })
    cardSkin: CatalogItem | null;

    @Prop({ required: true, type: CatalogItemSchema, default: null, nullable: true })
    matchEffect: CatalogItem | null;

    @Prop({ required: true, type: CatalogItemSchema, default: null, nullable: true })
    title: CatalogItem | null;
}

export const CurrentCustomizationSelectsSchema = SchemaFactory.createForClass(CurrentCustomizationSelects);
