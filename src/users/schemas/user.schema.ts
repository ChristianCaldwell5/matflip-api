import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PlayerStats, PlayerStatsSchema } from './player-stats.schema';
import { LevelInfo, LevelInfoSchema } from './level-info.schema';
import { CatalogItem, CatalogItemSchema } from 'src/catalog/schemas/catalog.schema';
import { CurrentCustomizationSelects, CurrentCustomizationSelectsSchema } from './current-customization-selects.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } })
export class User {
  // ** GOOGLE BASED USER FIELDS
  @Prop({ required: true, index: true })
  email: string;

  @Prop()
  name?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ index: true })
  googleId?: string;
  // ** END GOOGLE BASED USER FIELDS

  // ** MATFLIP bonus fields
  @Prop()
  displayName?: string;

  @Prop({ type: PlayerStatsSchema })
  stats?: PlayerStats;

  @Prop({ type: LevelInfoSchema })
  levelInfo?: LevelInfo;

  @Prop({ type: CurrentCustomizationSelectsSchema })
  currentCustomizationSelects?: CurrentCustomizationSelects;

  @Prop({ type: [CatalogItemSchema], default: [] })
  ownedCatalogItems?: CatalogItem[];
  // ** END MATFLIP bonus fields
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
