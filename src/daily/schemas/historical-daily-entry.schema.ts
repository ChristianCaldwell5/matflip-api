import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoricalDailyEntryDocument = HistoricalDailyEntry & Document;

/**
 * Permanent archive of a daily leaderboard entry after daily results are processed.
 * Written once per entry at the end of each day; never modified after insert.
 */
@Schema({ timestamps: true })
export class HistoricalDailyEntry {
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

    /** Chicago calendar date "YYYY-MM-DD" this entry belongs to. */
    @Prop({ required: true, index: true })
    dailyDateKey: string;

    @Prop({ type: Date, default: () => new Date() })
    submittedAt: Date;

    /** Final rank on the leaderboard (1 = fastest). */
    @Prop({ required: true })
    rank: number;

    /** XP rewarded to this player for their placement. */
    @Prop({ required: true, default: 0 })
    rewardedXp: number;

    /** FlipBucks rewarded to this player for their placement. */
    @Prop({ required: true, default: 0 })
    rewardedFlipBucks: number;
}

export const HistoricalDailyEntrySchema = SchemaFactory.createForClass(HistoricalDailyEntry);
