import { GameDifficulty } from "src/globals/enums/game-difficulties.enum";
import { GameMode } from "src/globals/enums/game-modes.enum";

/**
 * DTO for updating user progression based on game mode.
 * Different modes have different progression impacts and stat updates.
 * @property gameModeDirective the game mode to base the progression update on
 * @property flipsMade number of flips made, affects general stats and XP bonus
 * @property difficulty level, affects general stats and XP scaling
 * @property pairsMade number of pairs made (for PAIRS mode)
 * @property timeTakenInSeconds time taken to complete the game (for PAIRS mode)
 * @property solutionsFound number of solutions found (for SOLUTION mode)
 * @property solutionStreak current solution streak (for SOLUTION mode)
 * @property dailyTimeTakenInSeconds time taken for daily challenge (for DAILY mode)
 * */
export class ProgressionUpdateRequest {
    gameModeDirective!: GameMode;
    flipsMade?: number;
    difficulty?: GameDifficulty;

    pairsMade?: number;
    foundAllPairs?: boolean;
    timeTakenInSeconds?: number;

    solutionsFound?: number;
    solutionStreak?: number;

    dailyTimeTakenInSeconds?: number;
}
