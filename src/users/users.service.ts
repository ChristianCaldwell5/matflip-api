import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  findByUserId(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByGoogleId(googleId: string) {
    return this.userModel.findOne({ googleId }).exec();
  }

    upsertByEmail(email: string, update: Partial<User>) {
        // Ensure we never attempt to $set _id (immutable) and always work with a plain object
        const plain: any = (update as any)?.toObject ? (update as any).toObject() : { ...update };
        if (plain._id) {
            delete plain._id;
        }
        return this.userModel
            .findOneAndUpdate(
                { email },
                { $set: plain },
                { new: true, upsert: true }
            )
            .exec();
    }

    generateNewUserProfile(email: string, name?: string, avatarUrl?: string, googleId?: string): Partial<User> {
        // Return a POJO instead of a hydrated mongoose document so upsert doesn't include _id
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
                xpToNextLevel: 100,
            },
        };
    }

  shortenDisplayName(input?: string): string {
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
}
