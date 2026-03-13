import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyEntry, DailyEntryDocument } from '../schemas/daily-entry.schema';
import { HistoricalDailyEntry, HistoricalDailyEntryDocument } from '../schemas/historical-daily-entry.schema';
import { UsersService } from 'src/users/services/users.service';
import {
    LEADERBOARD_MAX_ENTRIES,
    PODIUM_XP, PODIUM_FLIP_BUCKS,
    TOP_FIFTY_XP, TOP_FIFTY_FLIP_BUCKS,
    LEADERBOARD_XP, LEADERBOARD_FLIP_BUCKS,
} from '../constants/daily-rewards.constants';

export interface DailyProcessingSummary {
    dateKey: string;
    processed: number;
    archived: number;
    skipped: number;
    alreadyProcessed: boolean;
}

@Injectable()
export class DailyResultsService {

    private readonly logger = new Logger(DailyResultsService.name);
    private readonly DAILY_TZ = 'America/Chicago';

    constructor(
        @InjectModel(DailyEntry.name) private readonly dailyEntryModel: Model<DailyEntryDocument>,
        @InjectModel(HistoricalDailyEntry.name) private readonly historicalModel: Model<HistoricalDailyEntryDocument>,
        private readonly usersService: UsersService,
    ) {}

    /** Runs at 12:05 AM Chicago time each day and processes the previous day's results. */
    @Cron('5 0 * * *', { timeZone: 'America/Chicago' })
    async processDailyResults(): Promise<void> {
        const yesterdayKey = this.getYesterdayKey();
        this.logger.log(`[DailyResults] Cron triggered — processing results for ${yesterdayKey}`);
        try {
            const summary = await this.processDateResults(yesterdayKey);
            this.logger.log(`[DailyResults] Done — ${JSON.stringify(summary)}`);
        } catch (err) {
            this.logger.error(`[DailyResults] Failed for ${yesterdayKey}`, err);
        }
    }

    /**
     * Core processing logic for a given dateKey. Extracted from the cron method
     * so it can be invoked independently (admin trigger, testing).
     *
     * Steps:
     * 1. Idempotency guard — skip if historical records already exist for dateKey.
     * 2. Fetch top 1000 entries sorted by timeTakenMs (fastest = rank 1).
     * 3. For each entry, resolve the user and award tiered XP + FlipBucks.
     * 4. Bulk-insert all entries into the historical collection (with rank + reward fields).
     * 5. Delete all live entries for that dateKey.
     */
    async processDateResults(dateKey: string): Promise<DailyProcessingSummary> {
        // Idempotency guard
        const existingHistorical = await this.historicalModel.countDocuments({ dailyDateKey: dateKey }).exec();
        if (existingHistorical > 0) {
            this.logger.warn(`[DailyResults] ${dateKey} already archived (${existingHistorical} records). Skipping.`);
            return { dateKey, processed: 0, archived: existingHistorical, skipped: 0, alreadyProcessed: true };
        }

        const entries = await this.dailyEntryModel
            .find({ dailyDateKey: dateKey })
            .sort({ timeTakenMs: 1 })
            .limit(LEADERBOARD_MAX_ENTRIES)
            .lean()
            .exec();

        if (entries.length === 0) {
            this.logger.log(`[DailyResults] No entries found for ${dateKey}. Nothing to process.`);
            return { dateKey, processed: 0, archived: 0, skipped: 0, alreadyProcessed: false };
        }

        const historicalDocs: Partial<HistoricalDailyEntry>[] = [];
        let processed = 0;
        let skipped = 0;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const rank = i + 1;
            const { xp, flipBucks } = this.resolveRewardTier(rank);

            try {
                const user = await this.usersService.findByGoogleId(entry.googleId);
                if (user) {
                    await this.usersService.awardLeaderboardReward(user, rank, xp, flipBucks);
                    processed++;
                } else {
                    this.logger.warn(`[DailyResults] User not found for googleId ${entry.googleId} (rank ${rank}) — skipping reward.`);
                    skipped++;
                }
            } catch (err) {
                this.logger.error(`[DailyResults] Error awarding reward to googleId ${entry.googleId} (rank ${rank})`, err);
                skipped++;
            }

            historicalDocs.push({
                googleId: entry.googleId,
                displayName: entry.displayName,
                title: entry.title ?? null,
                level: entry.level ?? null,
                timeTakenMs: entry.timeTakenMs,
                flipsMade: entry.flipsMade ?? 0,
                dailyDateKey: entry.dailyDateKey,
                submittedAt: entry.submittedAt,
                rank,
                rewardedXp: xp,
                rewardedFlipBucks: flipBucks,
            });
        }

        await this.historicalModel.insertMany(historicalDocs);

        // Clear live entries for this dateKey (top 1000 archived above; also remove any beyond 1000)
        await this.dailyEntryModel.deleteMany({ dailyDateKey: dateKey }).exec();

        this.logger.log(`[DailyResults] Archived ${historicalDocs.length} entries and cleared live collection for ${dateKey}.`);

        return {
            dateKey,
            processed,
            archived: historicalDocs.length,
            skipped,
            alreadyProcessed: false,
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private resolveRewardTier(rank: number): { xp: number; flipBucks: number } {
        if (rank <= 3)  return { xp: PODIUM_XP,      flipBucks: PODIUM_FLIP_BUCKS };
        if (rank <= 50) return { xp: TOP_FIFTY_XP,   flipBucks: TOP_FIFTY_FLIP_BUCKS };
        return               { xp: LEADERBOARD_XP,  flipBucks: LEADERBOARD_FLIP_BUCKS };
    }

    /** Returns the "YYYY-MM-DD" dateKey for yesterday in America/Chicago. */
    private getYesterdayKey(): string {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Intl.DateTimeFormat('en-CA', { timeZone: this.DAILY_TZ }).format(yesterday);
    }
}
