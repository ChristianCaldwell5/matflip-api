import { Body, Controller, Get, Post, BadRequestException, UnauthorizedException, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { DailyService } from './daily.service';
import { DailyResultsService } from './services/daily-results.service';
import { DailyInfoDto } from './dto/daily-info.dto';
import { DailyLeaderboardResponseDto } from './dto/daily-leaderboard-response.dto';
import { DailySubmitRequestDto } from './dto/daily-submit-request.dto';
import { DailySubmitResponseDto } from './dto/daily-submit-response.dto';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/services/users.service';

@Controller('daily')
export class DailyController {

    constructor(
        private readonly dailyService: DailyService,
        private readonly dailyResultsService: DailyResultsService,
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    /**
     * Get today's daily puzzle configuration.
     * Public — no auth required; used by both guests (info only) and signed-in users.
     */
    @Get()
    getDailyInfo(): DailyInfoDto {
        return this.dailyService.getDailyInfo();
    }

    /**
     * Get today's leaderboard.
     * Optionally marks the calling user's entry with isCurrentUser=true.
     */
    @Get('leaderboard')
    async getLeaderboard(
        @Req() req: Request,
        @Query('page') page = '1',
        @Query('limit') limit = '50',
    ): Promise<DailyLeaderboardResponseDto> {
        let callerGoogleId: string | undefined;
        try {
            const token = (req as any).cookies?.['mf_session'];
            if (token) {
                const claims = this.authService.verifySession(token);
                callerGoogleId = claims.sub as string | undefined;
            }
        } catch {
            // unauthenticated — still return leaderboard, just without isCurrentUser / userRank
        }
        return this.dailyService.getLeaderboard(
            Math.max(1, parseInt(page, 10) || 1),
            Math.min(50, Math.max(1, parseInt(limit, 10) || 50)),
            callerGoogleId,
        );
    }

    /**
     * Submit the current user's daily result.
     * Requires a valid session. Rejects duplicate submissions for today.
     */
    @Post('submit')
    async submitDailyResult(
        @Req() req: Request,
        @Body() body: DailySubmitRequestDto,
    ): Promise<DailySubmitResponseDto> {
        const token = (req as any).cookies?.['mf_session'];
        if (!token) {
            throw new BadRequestException('Missing session');
        }

        const claims = this.authService.verifySession(token);
        const googleId = claims.sub as string | undefined;
        if (!googleId) {
            throw new BadRequestException('Invalid session');
        }

        const user = await this.usersService.findByGoogleId(googleId);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const level = user.levelInfo?.currentLevel ?? null;
        const title = user.currentCustomizationSelects?.title?.displayName ?? null;

        return this.dailyService.submitDailyResult(googleId, user.displayName ?? user.name ?? 'Unknown', level, title, body);
    }

    /**
     * Admin-only trigger to manually run daily results processing for a given date.
     * Protected by the ADMIN_KEY environment variable via the x-mat-flip-admin-key header.
     * Accepts an optional ?dateKey=YYYY-MM-DD query param; defaults to yesterday (Chicago time).
     */
    @Post('process-results')
    async processResults(
        @Req() req: Request,
        @Query('dateKey') dateKey?: string,
    ) {
        const adminKey = process.env.ADMIN_KEY;
        const providedKey = req.headers['x-mat-flip-admin-key'];
        if (!adminKey || providedKey !== adminKey) {
            throw new UnauthorizedException('Invalid or missing admin key');
        }

        const targetDateKey = dateKey ?? this.getYesterdayKey();
        return this.dailyResultsService.processDateResults(targetDateKey);
    }

    /** Returns "YYYY-MM-DD" for yesterday in America/Chicago — used by the admin endpoint default. */
    private getYesterdayKey(): string {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(yesterday);
    }
}
