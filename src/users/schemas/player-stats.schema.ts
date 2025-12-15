import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class GeneralStats {
    @Prop({ default: 0 })
    totalGamesPlayed: number;

    @Prop({ default: 0 })
    totalFlips: number;
}

export const GeneralStatsSchema = SchemaFactory.createForClass(GeneralStats);

@Schema({ _id: false })
export class DailyStats {
    @Prop({ default: 0 })
    currentStreak: number;

    @Prop({ default: 0 })
    longestStreak: number;

    @Prop({ type: Date, default: null })
    lastPlayed: Date | null;

    @Prop({ default: 0 })
    totalTimesPlayed: number;

    @Prop({ default: 0 })
    timesPlacedOnLeaderboard: number;

    @Prop({ type: Number, default: null })
    bestLeaderboardPosition: number | null;

    @Prop({ type: Number, default: null })
    bestTimeInSeconds: number | null;
}

export const DailyStatsSchema = SchemaFactory.createForClass(DailyStats);

@Schema({ _id: false })
export class SolutionDifficultyStats {
    @Prop({ default: 0 })
    timesPlayed: number;
    @Prop({ default: 0 })
    solutionsFound: number;
    @Prop({ default: 0 })
    highestSolutionCount: number;
    @Prop({ default: 0 })
    bestStreakCount: number;
}
export const SolutionDifficultyStatsSchema = SchemaFactory.createForClass(SolutionDifficultyStats);

@Schema({ _id: false })
export class SolutionDifficulties {
    @Prop({ type: SolutionDifficultyStatsSchema, default: () => ({}) })
    easy: SolutionDifficultyStats;
    @Prop({ type: SolutionDifficultyStatsSchema, default: () => ({}) })
    medium: SolutionDifficultyStats;
    @Prop({ type: SolutionDifficultyStatsSchema, default: () => ({}) })
    hard: SolutionDifficultyStats;
    @Prop({ type: SolutionDifficultyStatsSchema, default: () => ({}) })
    expert: SolutionDifficultyStats;
}
export const SolutionDifficultiesSchema = SchemaFactory.createForClass(SolutionDifficulties);

@Schema({ _id: false })
export class SolutionStats {
    @Prop({ default: 0 })
    totalTimesPlayed: number;
    @Prop({ default: 0 })
    totalSolutionsFound: number;
    @Prop({ type: SolutionDifficultiesSchema, default: () => ({}) })
    difficultyBreakdown: SolutionDifficulties;
}
export const SolutionStatsSchema = SchemaFactory.createForClass(SolutionStats);

@Schema({ _id: false })
export class PairDifficultyStats {
    @Prop({ default: 0 })
    timesPlayed: number;
    @Prop({ default: 0 })
    timesWon: number;
    @Prop({ type: Number, default: null })
    bestTimeInSeconds: number | null;
    @Prop({ default: 0 })
    totalTimeInSeconds: number;
}
export const PairDifficultyStatsSchema = SchemaFactory.createForClass(PairDifficultyStats);

@Schema({ _id: false })
export class PairDifficulties {
    @Prop({ type: PairDifficultyStatsSchema, default: () => ({}) })
    easy: PairDifficultyStats;
    @Prop({ type: PairDifficultyStatsSchema, default: () => ({}) })
    medium: PairDifficultyStats;
    @Prop({ type: PairDifficultyStatsSchema, default: () => ({}) })
    hard: PairDifficultyStats;
    @Prop({ type: PairDifficultyStatsSchema, default: () => ({}) })
    expert: PairDifficultyStats;
    @Prop({ type: PairDifficultyStatsSchema, default: () => ({}) })
    mastery: PairDifficultyStats;
}
export const PairDifficultiesSchema = SchemaFactory.createForClass(PairDifficulties);

@Schema({ _id: false })
export class PairStats {
    @Prop({ default: 0 })
    totalTimesPlayed: number;
    @Prop({ default: 0 })
    totalMatchesFound: number;
    @Prop({ type: PairDifficultiesSchema, default: () => ({}) })
    difficultyBreakdown: PairDifficulties;
}
export const PairStatsSchema = SchemaFactory.createForClass(PairStats);

@Schema({ _id: false })
export class PlayerStats {
    @Prop({ type: GeneralStatsSchema, default: () => ({}) })
    general: GeneralStats;
    @Prop({ type: DailyStatsSchema, default: () => ({}) })
    daily: DailyStats;
    @Prop({ type: PairStatsSchema, default: () => ({}) })
    pairs: PairStats;
    @Prop({ type: SolutionStatsSchema, default: () => ({}) })
    solutions: SolutionStats;
}
export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);
