export class DailyLeaderboardEntryDto {
    rank: number;
    displayName: string;
    timeTakenMs: number;
    isCurrentUser?: boolean;
    level?: number | null;
    title?: string | null;
}
