import { Injectable } from "@nestjs/common";
import { User } from "../schemas/user.schema";
import { ProgressionUpdateRequest } from "../dto/progression-update-request.dto";
import { GameMode } from "src/globals/enums/game-modes.enum";
import { PairDifficulties, PlayerStats, SolutionDifficulties } from "../schemas/player-stats.schema";
import { GameDifficulty } from "src/globals/enums/game-difficulties.enum";

@Injectable()
export class StatsService {
    constructor() {}

    processUserStats(user: User, progressionUpdateRequest: ProgressionUpdateRequest): PlayerStats {
        // copy of user stats to modify
        const updatedStats = user.stats
        if (!updatedStats) {
            throw Error(`User stats for ${user.googleId} is unexpectedly undefined`)
        }

        updatedStats.general.totalGamesPlayed += 1;

        if (progressionUpdateRequest.flipsMade) {
            updatedStats.general.totalFlips += progressionUpdateRequest.flipsMade;
        }

        // Update user stats based on progressionUpdateRequest
        switch (progressionUpdateRequest.gameModeDirective) {
            case GameMode.PAIRS:
                updatedStats.pairs.totalTimesPlayed += 1;
                updatedStats.pairs.totalMatchesFound += progressionUpdateRequest.pairsMade ?? 0;
                updatedStats.pairs.difficultyBreakdown = this.updatePairDifficultyStats(
                    updatedStats.pairs.difficultyBreakdown,
                    progressionUpdateRequest
                );
                break;
            case GameMode.SOLUTION:
                updatedStats.solutions.totalTimesPlayed += 1;
                updatedStats.solutions.totalSolutionsFound += progressionUpdateRequest.solutionsFound ?? 0;
                updatedStats.solutions.difficultyBreakdown = this.updateSolutionDifficultyStats(
                    updatedStats.solutions.difficultyBreakdown,
                    progressionUpdateRequest
                );
                break;
            case GameMode.DAILY:
                updatedStats.daily.totalTimesPlayed += 1;
                updatedStats.daily.currentStreak += 1;
                if (progressionUpdateRequest.dailyTimeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!updatedStats.daily.bestTimeInSeconds) {
                        updatedStats.daily.bestTimeInSeconds = progressionUpdateRequest.dailyTimeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.dailyTimeTakenInSeconds < updatedStats.daily.bestTimeInSeconds) {
                        updatedStats.daily.bestTimeInSeconds = progressionUpdateRequest.dailyTimeTakenInSeconds;
                    }
                }
                // TODO: handle other daily stats updates (e.g., leaderboard placements)
                break;
            default:
                // No stats update for unknown game mode - log
                console.warn(`No stats update for unknown game mode: ${progressionUpdateRequest.gameModeDirective}`);
                break;
        }
        // Assign updated stats back to user
        user.stats = updatedStats;
        return updatedStats;
    }

    private updatePairDifficultyStats(pairDifficulty: PairDifficulties, progressionUpdateRequest: ProgressionUpdateRequest): PairDifficulties {
        let updatedDifficulties = pairDifficulty;
        switch (progressionUpdateRequest.difficulty) {
            case GameDifficulty.EASY:
                updatedDifficulties.easy.timesPlayed += 1;
                updatedDifficulties.easy.timesWon += progressionUpdateRequest.foundAllPairs ? 1 : 0;
                updatedDifficulties.easy.totalTimeInSeconds += progressionUpdateRequest.timeTakenInSeconds ?? 0;
                if (progressionUpdateRequest.timeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!pairDifficulty.easy.bestTimeInSeconds) {
                        updatedDifficulties.easy.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.timeTakenInSeconds < pairDifficulty.easy.bestTimeInSeconds) {
                        updatedDifficulties.easy.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                }
                break;
            case GameDifficulty.MEDIUM:
                updatedDifficulties.medium.timesPlayed += 1;
                updatedDifficulties.medium.timesWon += progressionUpdateRequest.foundAllPairs ? 1 : 0;
                updatedDifficulties.medium.totalTimeInSeconds += progressionUpdateRequest.timeTakenInSeconds ?? 0;
                if (progressionUpdateRequest.timeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!pairDifficulty.medium.bestTimeInSeconds) {
                        updatedDifficulties.medium.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.timeTakenInSeconds < pairDifficulty.medium.bestTimeInSeconds) {
                        updatedDifficulties.medium.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                }
                break;
            case GameDifficulty.HARD:
                updatedDifficulties.hard.timesPlayed += 1;
                updatedDifficulties.hard.timesWon += progressionUpdateRequest.foundAllPairs ? 1 : 0;
                updatedDifficulties.hard.totalTimeInSeconds += progressionUpdateRequest.timeTakenInSeconds ?? 0;
                if (progressionUpdateRequest.timeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!pairDifficulty.hard.bestTimeInSeconds) {
                        updatedDifficulties.hard.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.timeTakenInSeconds < pairDifficulty.hard.bestTimeInSeconds) {
                        updatedDifficulties.hard.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                }
                break;
            case GameDifficulty.EXPERT:
                updatedDifficulties.expert.timesPlayed += 1;
                updatedDifficulties.expert.timesWon += progressionUpdateRequest.foundAllPairs ? 1 : 0;
                updatedDifficulties.expert.totalTimeInSeconds += progressionUpdateRequest.timeTakenInSeconds ?? 0;
                if (progressionUpdateRequest.timeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!pairDifficulty.expert.bestTimeInSeconds) {
                        updatedDifficulties.expert.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.timeTakenInSeconds < pairDifficulty.expert.bestTimeInSeconds) {
                        updatedDifficulties.expert.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                }
                break;
            case GameDifficulty.MASTER:
                updatedDifficulties.mastery.timesPlayed += 1;
                updatedDifficulties.mastery.timesWon += progressionUpdateRequest.foundAllPairs ? 1 : 0;
                updatedDifficulties.mastery.totalTimeInSeconds += progressionUpdateRequest.timeTakenInSeconds ?? 0;
                if (progressionUpdateRequest.timeTakenInSeconds) {
                    // Update best time if not yet set (will be null)
                    if (!pairDifficulty.mastery.bestTimeInSeconds) {
                        updatedDifficulties.mastery.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                    // Update best time if new time is better
                    else if (progressionUpdateRequest.timeTakenInSeconds < pairDifficulty.mastery.bestTimeInSeconds) {
                        updatedDifficulties.mastery.bestTimeInSeconds = progressionUpdateRequest.timeTakenInSeconds;
                    }
                }
                break;
        }
        return updatedDifficulties;
    }

    private updateSolutionDifficultyStats(solutionDifficulties: SolutionDifficulties, progressionUpdateRequest: ProgressionUpdateRequest): SolutionDifficulties {
        let updatedDifficulties = solutionDifficulties;
        switch (progressionUpdateRequest.difficulty) {
            case GameDifficulty.EASY:
                updatedDifficulties.easy.timesPlayed += 1;
                updatedDifficulties.easy.solutionsFound += progressionUpdateRequest.solutionsFound ?? 0;
                if (progressionUpdateRequest.solutionStreak
                    && progressionUpdateRequest.solutionStreak > updatedDifficulties.easy.bestStreakCount) {
                    updatedDifficulties.easy.bestStreakCount = progressionUpdateRequest.solutionStreak;
                }
                
                if (progressionUpdateRequest.solutionsFound
                    && progressionUpdateRequest.solutionsFound > updatedDifficulties.easy.highestSolutionCount) {
                    updatedDifficulties.easy.highestSolutionCount = progressionUpdateRequest.solutionsFound;
                }
                break;
            case GameDifficulty.MEDIUM:
                updatedDifficulties.medium.timesPlayed += 1;
                updatedDifficulties.medium.solutionsFound += progressionUpdateRequest.solutionsFound ?? 0;
                if (progressionUpdateRequest.solutionStreak
                    && progressionUpdateRequest.solutionStreak > updatedDifficulties.medium.bestStreakCount) {
                    updatedDifficulties.medium.bestStreakCount = progressionUpdateRequest.solutionStreak;
                }

                if (progressionUpdateRequest.solutionsFound
                    && progressionUpdateRequest.solutionsFound > updatedDifficulties.medium.highestSolutionCount) {
                    updatedDifficulties.medium.highestSolutionCount = progressionUpdateRequest.solutionsFound;
                }
                break;
            case GameDifficulty.HARD:
                updatedDifficulties.hard.timesPlayed += 1;
                updatedDifficulties.hard.solutionsFound += progressionUpdateRequest.solutionsFound ?? 0;
                if (progressionUpdateRequest.solutionStreak
                    && progressionUpdateRequest.solutionStreak > updatedDifficulties.hard.bestStreakCount) {
                    updatedDifficulties.hard.bestStreakCount = progressionUpdateRequest.solutionStreak;
                }

                if (progressionUpdateRequest.solutionsFound
                    && progressionUpdateRequest.solutionsFound > updatedDifficulties.hard.highestSolutionCount) {
                    updatedDifficulties.hard.highestSolutionCount = progressionUpdateRequest.solutionsFound;
                }
                break;
            case GameDifficulty.EXPERT:
                updatedDifficulties.expert.timesPlayed += 1;
                updatedDifficulties.expert.solutionsFound += progressionUpdateRequest.solutionsFound ?? 0;
                if (progressionUpdateRequest.solutionStreak
                    && progressionUpdateRequest.solutionStreak > updatedDifficulties.expert.bestStreakCount) {
                    updatedDifficulties.expert.bestStreakCount = progressionUpdateRequest.solutionStreak;
                }

                if (progressionUpdateRequest.solutionsFound
                    && progressionUpdateRequest.solutionsFound > updatedDifficulties.expert.highestSolutionCount) {
                    updatedDifficulties.expert.highestSolutionCount = progressionUpdateRequest.solutionsFound;
                }
                break;
        }
        return updatedDifficulties;
    }

}