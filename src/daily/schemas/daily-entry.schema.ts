import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyEntryDocument = DailyEntry & Document;

/**
 * One leaderboard entry per user per daily.
 * dailyDateKey is the ISO date string "YYYY-MM-DD" (UTC) that uniquely identifies a daily.
 */
@Schema({ timestamps: true })
export class DailyEntry {
    @Prop({ required: true })
    googleId: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ type: String, default: null, nullable: true })
    title: string | null;

    @Prop({ type: Number, default: null, nullable: true })
    level: number | null;

    @Prop({ required: true })
    timeTakenMs: number;

    @Prop({ default: 0 })
    flipsMade: number;

    /** UTC date string "YYYY-MM-DD" identifying the daily this entry belongs to */
    @Prop({ required: true, index: true })
    dailyDateKey: string;

    @Prop({ type: Date, default: () => new Date() })
    submittedAt: Date;
}

export const DailyEntrySchema = SchemaFactory.createForClass(DailyEntry);

// Compound unique index: one entry per user per daily
DailyEntrySchema.index({ googleId: 1, dailyDateKey: 1 }, { unique: true });
