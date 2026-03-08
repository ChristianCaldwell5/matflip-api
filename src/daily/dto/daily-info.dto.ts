import { GameDifficulty } from 'src/globals/enums/game-difficulties.enum';

export class DailyInfoDto {
    startDatetime: string;
    endDatetime: string;
    difficulty: GameDifficulty;
    deckIndex: number;
    cardCount: number;
}
