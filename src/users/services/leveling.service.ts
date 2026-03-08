import { Injectable } from "@nestjs/common";
import { User } from "../schemas/user.schema";
import { ProgressionUpdateRequest } from "../dto/progression-update-request.dto";
import { LevelInfo } from "../schemas/level-info.schema";
import { GameMode } from "src/globals/enums/game-modes.enum";
import { GameDifficulty } from "src/globals/enums/game-difficulties.enum";
import { ProgressionUpdateResponse } from "../dto/progression-update-response.dto";
import { levelToXp } from "src/globals/dictionaries/level.dict";
import { ProgressionBreakdown } from "../dto/progression-breakdown.dto";
import { BreakdownType } from "src/globals/enums/breakdown-types.enum";
import { toUserDTO } from "../dto/user.dto";
import { CatalogService } from "src/catalog/catalog.service";
import { UnlockType } from "src/globals/enums/unlock-types.enum";
import { CatalogType } from "src/globals/enums/catalog-types.enum";
import { Catalog, CatalogItem } from "src/catalog/schemas/catalog.schema";

@Injectable()
export class LevelingService {

    PAIR_MATCH_XP = 10; // xp per pair matched
    PAIRS_EASY_WIN_XP = 5; // xp per EASY pair win
    PAIRS_MEDIUM_WIN_XP = 10; // xp per MEDIUM pair win
    PAIRS_HARD_WIN_XP = 15; // xp per HARD pair win
    PAIRS_EXPERT_WIN_XP = 20; // xp per EXPERT pair win
    PAIRS_MASTERY_WIN_XP = 25; // xp per MASTERY pair win
    SOLUTION_XP = 12; // xp per solution found

    QUICK_MATCHING_BONUS_XP = 15; // bonus xp for winning PAIRS quickly
    HIGH_STREAK_BONUS_XP = 20; // bonus xp for achieving high SOLUTION streaks
    DAILY_CHALLENGE_BONUS_XP = 50; // bonus xp for completing DAILY challenge

    EASY_QUICK_TIME_THRESHOLD = 20; // seconds for easy mode quick matching
    MEDIUM_QUICK_TIME_THRESHOLD = 25; // seconds for medium mode quick matching
    HARD_QUICK_TIME_THRESHOLD = 35; // seconds for hard mode quick matching
    EXPERT_QUICK_TIME_THRESHOLD = 40; // seconds for expert mode quick matching
    MASTERY_QUICK_TIME_THRESHOLD = 40; // seconds for mastery mode quick matching

    EASY_STREAK_THRESHOLD = 10; // streak in SOLUTION needed for bonus in easy mode
    MEDIUM_STREAK_THRESHOLD = 8; // streak in SOLUTION needed for bonus in medium mode
    HARD_STREAK_THRESHOLD = 6; // streak in SOLUTION needed for bonus in hard mode
    EXPERT_STREAK_THRESHOLD = 5; // streak in SOLUTION needed for bonus in expert mode

    HARD_MODE_MULTIPLIER = 1.10; // xp multiplier for hard mode
    EXPERT_MODE_MULTIPLIER = 1.15; // xp multiplier for expert mode
    MASTERY_MODE_MULTIPLIER = 1.20; // xp multiplier for mastery mode (PAIRS only)

    constructor(private readonly catalogService: CatalogService) {}

    async processUserLeveling(user: User, progressionUpdateRequest: ProgressionUpdateRequest): Promise<ProgressionUpdateResponse> {
        
        if (!user.levelInfo) {
            throw Error(`User level info for ${user.googleId} is unexpectedly undefined`);
        }

        const currentUserLevel = user.levelInfo.currentLevel;
        const currentXp = user.levelInfo.currentXp;
        const xpToNextLevel = user.levelInfo.xpToNextLevel;

        console.log(`Processing leveling for user ${user.googleId}: Level ${currentUserLevel}, XP ${currentXp}/${xpToNextLevel}`);

        let cumulativeXpGained = 0; // total XP gained from this progression update
        // get a copy of the user's current leveling info
        let updatedUserLeveling = user.levelInfo
        // initialize breakdown array
        let progressionBreakdowns: ProgressionBreakdown[] = [];

        switch (progressionUpdateRequest.gameModeDirective) {
            case GameMode.PAIRS:
                // Calculate XP from pairs matched
                if (progressionUpdateRequest.pairsMade) {
                    cumulativeXpGained += progressionUpdateRequest.pairsMade * this.PAIR_MATCH_XP;
                    // add breakdown entry
                    progressionBreakdowns.push({
                        type: BreakdownType.BASE_XP_GAINED,
                        amount: progressionUpdateRequest.pairsMade * this.PAIR_MATCH_XP,
                        description: `Matched ${progressionUpdateRequest.pairsMade} pairs`,
                    });
                }

                // Calculate XP from pairs won based on difficulty
                if (progressionUpdateRequest.foundAllPairs && progressionUpdateRequest.difficulty) {
                    let winBonusXp = 0;
                    switch (progressionUpdateRequest.difficulty) {
                        case GameDifficulty.EASY:
                            winBonusXp = this.PAIRS_EASY_WIN_XP;
                            break;
                        case GameDifficulty.MEDIUM:
                            winBonusXp = this.PAIRS_MEDIUM_WIN_XP;
                            break;
                        case GameDifficulty.HARD:
                            winBonusXp = this.PAIRS_HARD_WIN_XP;
                            break;
                        case GameDifficulty.EXPERT:
                            winBonusXp = this.PAIRS_EXPERT_WIN_XP;
                            break;
                        case GameDifficulty.MASTER:
                            winBonusXp = this.PAIRS_MASTERY_WIN_XP;
                            break;
                    }
                    cumulativeXpGained += winBonusXp;
                    // add breakdown entry
                    progressionBreakdowns.push({
                        type: BreakdownType.SUCCESS_BONUS_XP_GAINED,
                        amount: winBonusXp,
                        description: `Beat Pairs on ${progressionUpdateRequest.difficulty} mode`,
                    });
                }

                // Check for quick matching bonus
                if (progressionUpdateRequest.timeTakenInSeconds && progressionUpdateRequest.difficulty) {
                    let quickTimeThreshold = 0;
                    switch (progressionUpdateRequest.difficulty) {
                        case GameDifficulty.EASY:
                            quickTimeThreshold = this.EASY_QUICK_TIME_THRESHOLD;
                            break;
                        case GameDifficulty.MEDIUM:
                            quickTimeThreshold = this.MEDIUM_QUICK_TIME_THRESHOLD;
                            break;
                        case GameDifficulty.HARD:
                            quickTimeThreshold = this.HARD_QUICK_TIME_THRESHOLD;
                            break;
                        case GameDifficulty.EXPERT:
                            quickTimeThreshold = this.EXPERT_QUICK_TIME_THRESHOLD;
                            break;
                        case GameDifficulty.MASTER:
                            quickTimeThreshold = this.MASTERY_QUICK_TIME_THRESHOLD;
                            break;
                    }
                    if (progressionUpdateRequest.timeTakenInSeconds <= quickTimeThreshold) {
                        cumulativeXpGained += this.QUICK_MATCHING_BONUS_XP;
                        // add breakdown entry
                        progressionBreakdowns.push({
                            type: BreakdownType.QUICK_BONUS_XP_GAINED,
                            amount: this.QUICK_MATCHING_BONUS_XP,
                            description: `Completed quickly in ${progressionUpdateRequest.timeTakenInSeconds} seconds`,
                        });
                    }
                }
                break;
            case GameMode.SOLUTION:
                // Calculate XP from solutions found
                if (progressionUpdateRequest.solutionsFound) {
                    cumulativeXpGained += progressionUpdateRequest.solutionsFound * this.SOLUTION_XP;
                    // add breakdown entry
                    progressionBreakdowns.push({
                        type: BreakdownType.BASE_XP_GAINED,
                        amount: progressionUpdateRequest.solutionsFound * this.SOLUTION_XP,
                        description: `Completed quickly in ${progressionUpdateRequest.timeTakenInSeconds} seconds`,
                    });
                }

                // Check for high streak bonus
                if (progressionUpdateRequest.solutionStreak && progressionUpdateRequest.difficulty) {
                    let streakThreshold = 0;
                    switch (progressionUpdateRequest.difficulty) {
                        case GameDifficulty.EASY:
                            streakThreshold = this.EASY_STREAK_THRESHOLD;
                            break;
                        case GameDifficulty.MEDIUM:
                            streakThreshold = this.MEDIUM_STREAK_THRESHOLD;
                            break;
                        case GameDifficulty.HARD:
                            streakThreshold = this.HARD_STREAK_THRESHOLD;
                            break;
                        case GameDifficulty.EXPERT:
                            streakThreshold = this.EXPERT_STREAK_THRESHOLD;
                            break;
                    }
                    if (progressionUpdateRequest.solutionStreak >= streakThreshold) {
                        cumulativeXpGained += this.HIGH_STREAK_BONUS_XP;
                        // add breakdown entry
                        progressionBreakdowns.push({
                            type: BreakdownType.STREAK_BONUS_XP_GAINED,
                            amount: this.HIGH_STREAK_BONUS_XP,
                            description: `Achieved a streak of ${progressionUpdateRequest.solutionStreak}`,
                        });
                    }
                }
                break;
            case GameMode.DAILY:
                // Base XP from pairs matched
                if (progressionUpdateRequest.pairsMade) {
                    cumulativeXpGained += progressionUpdateRequest.pairsMade * this.PAIR_MATCH_XP;
                    progressionBreakdowns.push({
                        type: BreakdownType.BASE_XP_GAINED,
                        amount: progressionUpdateRequest.pairsMade * this.PAIR_MATCH_XP,
                        description: `Matched ${progressionUpdateRequest.pairsMade} pairs`,
                    });
                }
                // Fixed daily completion bonus
                cumulativeXpGained += this.DAILY_CHALLENGE_BONUS_XP;
                progressionBreakdowns.push({
                    type: BreakdownType.DAILY_BONUS_XP_GAINED,
                    amount: this.DAILY_CHALLENGE_BONUS_XP,
                    description: `Completed the daily challenge`,
                });
                break;
        }

        // Apply difficulty multipliers
        if (progressionUpdateRequest.difficulty) {
            let activeMultiplier = null;
            switch (progressionUpdateRequest.difficulty) {
                case GameDifficulty.HARD:
                    activeMultiplier = this.HARD_MODE_MULTIPLIER;
                    break;
                case GameDifficulty.EXPERT:
                    activeMultiplier = this.EXPERT_MODE_MULTIPLIER;
                    break;
                case GameDifficulty.MASTER:
                    if (progressionUpdateRequest.gameModeDirective === GameMode.PAIRS) {
                        activeMultiplier = this.MASTERY_MODE_MULTIPLIER;
                    }
                    break;
            }
            if (activeMultiplier) {
                const multiplierXp = Math.floor(cumulativeXpGained * (activeMultiplier - 1));
                cumulativeXpGained += multiplierXp;
                // add breakdown entry
                progressionBreakdowns.push({
                    type: BreakdownType.XP_MULTIPLIER_APPLIED,
                    amount: multiplierXp,
                    multiplier: activeMultiplier,
                    description: `Applied a ${((activeMultiplier - 1) * 100).toFixed(0)}% difficulty multiplier [${progressionUpdateRequest.difficulty}]`,
                });
            }
        }

        console.log(`Total XP gained for user ${user.googleId}:`, cumulativeXpGained);
        // add total xp gained breakdown entry
        progressionBreakdowns.push({
            type: BreakdownType.TOTAL_XP_GAINED,
            amount: cumulativeXpGained,
            description: `Total XP gained from this game`,
        });

        let currLvl = currentUserLevel
        let currXp = currentXp
        let xpNextLvl = xpToNextLevel
        // Cache catalogs once for reward checks during this update
        const catalogs = await this.catalogService.findAll();
        while (cumulativeXpGained > 0) {

            if (cumulativeXpGained + currXp >= xpNextLvl) {
                // Level up & carry over XP
                cumulativeXpGained -= (xpNextLvl - currXp);

                currLvl += 1
                const newXpNextLvl = this.getXpForLevel(currLvl + 1)

                updatedUserLeveling.currentLevel = currLvl;
                updatedUserLeveling.currentXp = 0;
                updatedUserLeveling.xpToNextLevel = newXpNextLvl;
                // add breakdown entry
                progressionBreakdowns.push({
                    type: BreakdownType.LEVEL_UP,
                    amount: (xpNextLvl - currXp),
                    toLevel: updatedUserLeveling.currentLevel,
                    description: `Leveled up to level ${updatedUserLeveling.currentLevel} with ${(xpNextLvl - currXp)} XP!`,
                });
                // Award any catalog items unlocked by reaching this level
                const unlocked = this.getLevelUpRewardsForLevel(catalogs, updatedUserLeveling.currentLevel, user.ownedCatalogItems || []);
                if (unlocked.length > 0) {
                    let unlockDescription: string  = "";
                    
                    // Ensure owned items array exists
                    user.ownedCatalogItems = user.ownedCatalogItems || [];
                    for (const item of unlocked) {
                        user.ownedCatalogItems.push(item);
                        let itemDesc: string;
                        switch (item.type) {
                            case CatalogType.CARD_SKIN:
                                itemDesc = 'Skin';
                                break;
                            case CatalogType.MATCH_EFFECT:
                                itemDesc = 'Effect';
                                break;
                            case CatalogType.TITLE:
                                itemDesc = 'Title';
                                break;
                            default:
                                itemDesc = 'Other';
                        }
                        unlockDescription += `${itemDesc}: "${item.displayName}", `;
                    }
                    // trim trailing comma and space
                    unlockDescription = unlockDescription.slice(0, -2);

                    // add breakdown entry for earned catalog items
                    progressionBreakdowns.push({
                        type: BreakdownType.EARNED_CATALOG_ITEM,
                        toLevel: updatedUserLeveling.currentLevel,
                        description: `${unlockDescription}`,
                    });
                }
                currXp = 0;
            } else {
                // Just add XP
                updatedUserLeveling.currentXp = currXp + cumulativeXpGained;
                cumulativeXpGained = 0;
            }
        }
        console.log(`Updated leveling for user ${user.googleId}:`, updatedUserLeveling);
        user.levelInfo = updatedUserLeveling;

        const response = new ProgressionUpdateResponse();
        response.user = toUserDTO(user);
        response.breakdown = progressionBreakdowns;

        return response;
    }

    getXpForLevel(level: number): number {
        if (level <= 100) {
            return levelToXp[level];
        }
        return 1200; // prestige level cap XP
    }

    /**
     * Get names of catalog items with `unlockType=LEVEL_UP` that have a `levelRequirement` <= reachedLevel
     * and are not already owned.
     */
    private getLevelUpRewardsForLevel(catalogs: Catalog[], reachedLevel: number, alreadyOwned: CatalogItem[]): CatalogItem[] {
        const ownedNameSet = new Set((alreadyOwned || []).map(i => i?.name).filter(Boolean));
        const unlocked: CatalogItem[] = [];
        for (const catalog of catalogs || []) {
            for (const item of (catalog?.items || [])) {
                if (item?.unlockType === UnlockType.LEVEL_UP && !item?.isRetired) {
                    const req = item?.levelRequirement ?? null;
                    if (req !== null && req !== undefined && req <= reachedLevel) {
                        const name = item?.name;
                        if (name && !ownedNameSet.has(name)) {
                            unlocked.push(item);
                            ownedNameSet.add(name);
                        }
                    }
                }
            }
        }
        return unlocked;
    }
}
    