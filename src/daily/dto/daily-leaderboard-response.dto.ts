import { DailyLeaderboardEntryDto } from './daily-leaderboard-entry.dto';

export class DailyLeaderboardResponseDto {
    entries: DailyLeaderboardEntryDto[];
    total: number;       // capped at 1000
    userRank: number | null; // caller's rank regardless of whether they're in top 1000
}
