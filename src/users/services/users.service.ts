import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ProgressionUpdateRequest } from '../dto/progression-update-request.dto';
import { ProgressionUpdateResponse } from '../dto/progression-update-response.dto';
import { LevelingService } from './leveling.service';
import { StatsService } from './stats.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly statsService: StatsService,
        private readonly levelingService: LevelingService
    ) {}

    // create a new user in the database
    create(data: Partial<User>) {
        return this.userModel.create(data);
    }

    // find user by their internal user ID in the database
    findByUserId(id: string) {
        return this.userModel.findById(id).exec();
    }

    // find user by their Google ID
    findByGoogleId(googleId: string) {
        return this.userModel.findOne({ googleId }).exec();
    }

    // update or insert user by their email
    upsertByEmail(email: string, update: Partial<User>) {
        // Ensure the object is plain and remove _id if present
        const plain: any = (update as any)?.toObject ? (update as any).toObject() : { ...update };
        if (plain._id) {
            delete plain._id;
        }
        // update user with plain object, create if not found
        return this.userModel
            .findOneAndUpdate(
                { email },
                { $set: plain },
                { new: true, upsert: true }
            )
            .exec();
    }

    /**
     * Generate a new user profile object
     * @param email the unique email of the user
     * @param name the name of the user
     * @param avatarUrl the profile avatar URL
     * @param googleId the Google ID of the user
     * @returns a partial user object
     */
    generateNewUserProfile(email: string, name?: string, avatarUrl?: string, googleId?: string): Partial<User> {
        return {
            email,
            googleId,
            avatarUrl,
            name,
            displayName: this.shortenDisplayName(name),
            stats: {
                general: {
                    totalGamesPlayed: 0,
                    totalFlips: 0,
                },
                daily: {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastPlayed: null,
                    timesPlayed: 0,
                    timesPlacedOnLeaderboard: 0,
                    bestLeaderboardPosition: null,
                    bestTimeInSeconds: null,
                },
                pairs: {
                    totalTimesPlayed: 0,
                    totalMatchesFound: 0,
                    difficultyBreakdown: {
                        easy: { timesPlayed: 0, timesWon: 0, bestTimeInSeconds: 0 },
                        medium: { timesPlayed: 0, timesWon: 0, bestTimeInSeconds: 0 },
                        hard: { timesPlayed: 0, timesWon: 0, bestTimeInSeconds: 0 },
                        expert: { timesPlayed: 0, timesWon: 0, bestTimeInSeconds: 0 },
                        mastery: { timesPlayed: 0, timesWon: 0, bestTimeInSeconds: 0 },
                    },
                },
                solutions: {
                    totalTimesPlayed: 0,
                    difficultyBreakdown: {
                        easy: { timesPlayed: 0, highestSolutionCount: 0, bestStreakCount: 0 },
                        medium: { timesPlayed: 0, highestSolutionCount: 0, bestStreakCount: 0 },
                        hard: { timesPlayed: 0, highestSolutionCount: 0, bestStreakCount: 0 },
                        expert: { timesPlayed: 0, highestSolutionCount: 0, bestStreakCount: 0 },
                    },
                },
            } as any,
            levelInfo: {
                currentLevel: 1,
                currentXp: 0,
                xpToNextLevel: this.levelingService.getXpForLevel(2),
            },
            ownedCatalogItems: [],
            currentCustomizationSelects: {
                cardSkin: null,
                matchEffect: null,
                title: null,
            },
        };
    }

    /**
     * Shorten name to a 20 character display name. If there's a space, keep first name + first initial.
     * @param input name to shorten
     * @returns shortened display name
     */
    private shortenDisplayName(input?: string): string {
        if (!input) return '';
        const truncated = input.slice(0, 20);
        const spaceIndex = truncated.indexOf(' ');
        if (spaceIndex === -1) {
            return truncated.trimEnd();
        }
        // Keep first name + space + first initial
        const afterSpaceChar = truncated[spaceIndex + 1];
        if (!afterSpaceChar || afterSpaceChar === ' ') {
        // Consecutive spaces or nothing after space: just first segment
        return truncated.slice(0, spaceIndex).trimEnd();
        }
        return truncated.slice(0, spaceIndex + 2).trimEnd();
    }

    updatePlayerProgression(user: User, progressionUpdate: ProgressionUpdateRequest): ProgressionUpdateResponse {
        // update player stats based on progressionUpdate (side-effect)
        const updatedStats = this.statsService.processUserStats(user, progressionUpdate);

        user.stats = updatedStats;

        // Update player level based on progressionUpdate
        const levelingResult = this.levelingService.processUserLeveling(user, progressionUpdate);
        // persist updated user
        this.upsertByEmail(user.email, levelingResult.user);
        
        return levelingResult;
    }
}
