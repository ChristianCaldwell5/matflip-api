import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LevelInfo {
    @Prop({ required: true, default: 1 })
    currentLevel: number;

    @Prop({ required: true, default: 0 })
    currentXp: number;

    @Prop({ required: true, default: 100 })
    xpToNextLevel: number;
}

export const LevelInfoSchema = SchemaFactory.createForClass(LevelInfo);
