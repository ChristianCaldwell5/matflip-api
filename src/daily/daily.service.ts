import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyEntry, DailyEntryDocument } from './schemas/daily-entry.schema';
import { DailyInfoDto } from './dto/daily-info.dto';
import { DailyLeaderboardEntryDto } from './dto/daily-leaderboard-entry.dto';
import { DailyLeaderboardResponseDto } from './dto/daily-leaderboard-response.dto';
import { DailySubmitRequestDto } from './dto/daily-submit-request.dto';
import { DailySubmitResponseDto } from './dto/daily-submit-response.dto';
import { GameDifficulty } from 'src/globals/enums/game-difficulties.enum';

/** Difficulty by Chicago day of week — index 0=Sun, 1=Mon, …, 6=Sat */
const DIFFICULTY_BY_DOW: Record<number, GameDifficulty> = {
    0: GameDifficulty.MEDIUM,  // Sunday
    1: GameDifficulty.EASY,    // Monday
    2: GameDifficulty.MEDIUM,  // Tuesday
    3: GameDifficulty.HARD,    // Wednesday
    4: GameDifficulty.EXPERT,  // Thursday
    5: GameDifficulty.MASTER,  // Friday
    6: GameDifficulty.HARD,    // Saturday
};

/** Card counts per difficulty for the daily */
const DAILY_CARD_COUNT: Record<GameDifficulty, number> = {
    [GameDifficulty.EASY]: 10,
    [GameDifficulty.MEDIUM]: 12,
    [GameDifficulty.HARD]: 16,
    [GameDifficulty.EXPERT]: 20,
    [GameDifficulty.MASTER]: 24,
};

/** Number of icon decks available in IconService masterList */
const DECK_COUNT = 10;

@Injectable()
export class DailyService {

    constructor(
        @InjectModel(DailyEntry.name) private readonly dailyEntryModel: Model<DailyEntryDocument>,
    ) {}

    private readonly DAILY_TZ = 'America/Chicago';

    // ─── Daily Info ────────────────────────────────────────────────────────────

    getDailyInfo(): DailyInfoDto {
        const now = new Date();
        const { startDatetime, endDatetime, dayOfYear, dow } = this.getDailyWindow(now);
        const difficulty = DIFFICULTY_BY_DOW[dow];
        const deckIndex = dayOfYear % DECK_COUNT;
        const cardCount = DAILY_CARD_COUNT[difficulty];

        return {
            startDatetime: startDatetime.toISOString(),
            endDatetime: endDatetime.toISOString(),
            difficulty,
            deckIndex,
            cardCount,
        };
    }

    // ─── Leaderboard ──────────────────────────────────────────────────────────

    async getLeaderboard(page: number, limit: number, callerGoogleId?: string): Promise<DailyLeaderboardResponseDto> {
        const MAX_ENTRIES = 1000;
        const todayKey = this.getTodayKey();
        const cappedLimit = Math.min(Math.max(1, limit), 50);
        const skip = (page - 1) * cappedLimit;

        const rawTotal = await this.dailyEntryModel.countDocuments({ dailyDateKey: todayKey }).exec();
        const total = Math.min(rawTotal, MAX_ENTRIES);

        if (skip >= MAX_ENTRIES) {
            return { entries: [], total, userRank: null };
        }

        const actualLimit = Math.min(cappedLimit, MAX_ENTRIES - skip);
        const entries = await this.dailyEntryModel
            .find({ dailyDateKey: todayKey })
            .sort({ timeTakenMs: 1 })
            .skip(skip)
            .limit(actualLimit)
            .lean()
            .exec();

        const mappedEntries: DailyLeaderboardEntryDto[] = entries.map((entry, index) => ({
            rank: skip + index + 1,
            displayName: entry.displayName,
            timeTakenMs: entry.timeTakenMs,
            isCurrentUser: callerGoogleId ? entry.googleId === callerGoogleId : false,
            level: entry.level ?? null,
            title: entry.title ?? null,
        }));

        // Resolve caller's rank even if they're outside the top 1000
        let userRank: number | null = null;
        if (callerGoogleId) {
            const userEntry = await this.dailyEntryModel
                .findOne({ googleId: callerGoogleId, dailyDateKey: todayKey })
                .lean()
                .exec();
            if (userEntry) {
                userRank = await this.dailyEntryModel.countDocuments({
                    dailyDateKey: todayKey,
                    timeTakenMs: { $lt: userEntry.timeTakenMs },
                }).exec() + 1;
            }
        }

        return { entries: mappedEntries, total, userRank };
    }

    // ─── Submit Result ─────────────────────────────────────────────────────────

    async submitDailyResult(
        googleId: string,
        displayName: string,
        level: number | null,
        title: string | null,
        body: DailySubmitRequestDto,
    ): Promise<DailySubmitResponseDto> {
        const todayKey = this.getTodayKey();

        // Guard: prevent duplicate submissions for today
        const existing = await this.dailyEntryModel.findOne({ googleId, dailyDateKey: todayKey }).lean().exec();
        if (existing) {
            throw new BadRequestException('Daily already submitted for today');
        }

        await this.dailyEntryModel.create({
            googleId,
            displayName,
            title,
            level,
            timeTakenMs: body.timeTakenMs,
            flipsMade: body.flipsMade ?? 0,
            dailyDateKey: todayKey,
            submittedAt: new Date(),
        });

        // Determine rank: count entries faster than this submission + 1
        const rank = await this.dailyEntryModel.countDocuments({
            dailyDateKey: todayKey,
            timeTakenMs: { $lt: body.timeTakenMs },
        }).exec() + 1;

        return { rank, timeTakenMs: body.timeTakenMs };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns the daily window anchored to midnight America/Chicago (handles CDT/CST automatically).
     * startDatetime / endDatetime are UTC instants; dayOfYear and dow are Chicago-calendar values.
     */
    private getDailyWindow(now: Date): { startDatetime: Date; endDatetime: Date; dayOfYear: number; dow: number } {
        const dateKey = this.getDateKey(now);
        const startDatetime = this.tzMidnight(dateKey);
        const endDatetime = new Date(startDatetime.getTime() + 24 * 60 * 60 * 1000);

        // dow from the Chicago calendar date
        const [year, month, day] = dateKey.split('-').map(Number);
        const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

        // dayOfYear relative to Chicago Jan 1 midnight
        const startOfYear = this.tzMidnight(`${year}-01-01`);
        const dayOfYear = Math.floor((startDatetime.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));

        return { startDatetime, endDatetime, dayOfYear, dow };
    }

    /**
     * Convert a "YYYY-MM-DD" Chicago calendar date to the UTC instant of midnight
     * in America/Chicago (DST-aware, no external dependencies).
     */
    private tzMidnight(dateKey: string): Date {
        // Use T15:00:00Z as a reference — always within the correct Chicago calendar day
        // (Chicago is UTC-5/UTC-6, so 15:00Z = 09:00/10:00 local, safely mid-day)
        const ref = new Date(`${dateKey}T15:00:00Z`);
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: this.DAILY_TZ,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        }).formatToParts(ref);
        const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type, parseInt(x.value)]));
        const msIntoDay = (p['hour'] % 24) * 3_600_000 + p['minute'] * 60_000 + p['second'] * 1_000;
        return new Date(ref.getTime() - msIntoDay);
    }

    /** Returns "YYYY-MM-DD" for today in America/Chicago. */
    private getDateKey(now: Date): string {
        return new Intl.DateTimeFormat('en-CA', { timeZone: this.DAILY_TZ }).format(now);
    }

    /** Public accessor used by the controller/submit flow. */
    getTodayKey(): string {
        return this.getDateKey(new Date());
    }
}
