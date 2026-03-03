import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ProgressionUpdateRequest } from '../dto/progression-update-request.dto';
import { ProgressionUpdateResponse } from '../dto/progression-update-response.dto';
import { PurchaseRequest } from '../dto/purchase-request.dto';
import { PurchaseResponse } from '../dto/purchase-response.dto';
import { LevelingService } from './leveling.service';
import { BreakdownType } from 'src/globals/enums/breakdown-types.enum';
import { StatsService } from './stats.service';
import { CatalogService } from 'src/catalog/catalog.service';
import { toUserDTO } from '../dto/user.dto';
import { RarityType } from 'src/globals/enums/rarity-types.enum';
import { UnlockType } from 'src/globals/enums/unlock-types.enum';

@Injectable()
export class UsersService {
    private readonly bucksPerXp: number;
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly statsService: StatsService,
        private readonly levelingService: LevelingService,
        private readonly catalogService: CatalogService,
    ) {
        const KEnv = Number(process.env.FLIP_BUCKS_PER_XP);
        this.bucksPerXp = Number.isFinite(KEnv) && KEnv >= 0 ? KEnv : 0.2;
    }

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

    async updatePlayerProgression(user: User, progressionUpdate: ProgressionUpdateRequest): Promise<ProgressionUpdateResponse> {
        // update player stats based on progressionUpdate (side-effect)
        const updatedStats = this.statsService.processUserStats(user, progressionUpdate);

        user.stats = updatedStats;

        // Update player level based on progressionUpdate
        const levelingResult = await this.levelingService.processUserLeveling(user, progressionUpdate);
        // Convert total XP gained into Flip Bucks (Option A: XP-indexed)
        const totalXp = (levelingResult.breakdown || []).find(b => b.type === BreakdownType.TOTAL_XP_GAINED)?.amount || 0;
        const flipBucksEarned = Math.floor(totalXp * this.bucksPerXp);
        if (flipBucksEarned > 0) {
            user.flipBucks = (user.flipBucks ?? 0) + flipBucksEarned;
            // update response DTO to reflect new flipBucks
            levelingResult.user.flipBucks = user.flipBucks;
            // add breakdown entry
            levelingResult.breakdown.push({
                type: BreakdownType.FLIP_BUCKS_EARNED,
                amount: flipBucksEarned,
                description: `Converted ${totalXp} XP to ${flipBucksEarned} Flip Bucks`,
            });
        }
        // persist updated user
        await this.upsertByEmail(user.email, levelingResult.user);
        
        return levelingResult;
    }

    /**
     * Process a store purchase for a user.
     * Verifies the item exists in the catalog, is purchasable,
     * that the user hasn't already purchased it, and has enough Flip Bucks.
     */
    async purchaseStoreCatalogItem(user: User, purchaseRequest: PurchaseRequest): Promise<PurchaseResponse> {
        const { catalogName, itemName } = purchaseRequest;

        // Look up the catalog
        const catalog = await this.catalogService.findByName(catalogName);
        if (!catalog) {
            throw new BadRequestException(`Catalog '${catalogName}' not found`);
        }

        // Find the specific item
        const catalogItem = catalog.items.find(i => i.name === itemName);
        if (!catalogItem) {
            throw new BadRequestException(`Item '${itemName}' not found in catalog '${catalogName}'`);
        }

        // Ensure the item is purchasable (must be an in-game purchase type)
        if (catalogItem.unlockType !== UnlockType.IN_GAME_PURCHASE) {
            throw new BadRequestException('This item is not available for purchase');
        }

        // Resolve price: explicit flipBucksRequirement or fallback by rarity
        const price = catalogItem.flipBucksRequirement ?? this.getDefaultPriceForRarity(catalogItem.rarity);

        // Check if already owned
        const alreadyOwned = (user.ownedCatalogItems ?? []).some(o => o.name === itemName);
        if (alreadyOwned) {
            throw new BadRequestException('You already own this item');
        }

        // Check balance
        const currentBucks = user.flipBucks ?? 0;
        if (currentBucks < price) {
            throw new BadRequestException('Not enough Flip Bucks');
        }

        // Deduct and add item
        const updatedUser = await this.userModel.findOneAndUpdate(
            { email: user.email },
            {
                $inc: { flipBucks: -price },
                $push: { ownedCatalogItems: catalogItem },
            },
            { new: true },
        ).exec();

        if (!updatedUser) {
            throw new BadRequestException('Failed to process purchase');
        }

        return {
            user: toUserDTO(updatedUser),
            purchasedItemName: itemName,
            flipBucksSpent: price,
        };
    }

    private getDefaultPriceForRarity(rarity: RarityType): number {
        switch (rarity) {
            case RarityType.COMMON:    return 100;
            case RarityType.UNCOMMON:  return 250;
            case RarityType.RARE:      return 500;
            case RarityType.EPIC:      return 900;
            case RarityType.LEGENDARY: return 1500;
            default:                   return 250;
        }
    }
}
