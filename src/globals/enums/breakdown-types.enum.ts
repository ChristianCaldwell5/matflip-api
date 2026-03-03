/**
 * Enumeration for different types of progression breakdowns.
 * These can be used by the frontend to display detailed progression information and language
 */
export enum BreakdownType {
    BASE_XP_GAINED = 'BASE_XP_GAINED',
    QUICK_BONUS_XP_GAINED = 'QUICK_BONUS_XP_GAINED',
    STREAK_BONUS_XP_GAINED = 'STREAK_BONUS_XP_GAINED',
    DAILY_BONUS_XP_GAINED = 'DAILY_BONUS_XP_GAINED',
    SUCCESS_BONUS_XP_GAINED = 'SUCCESS_BONUS_XP_GAINED',
    XP_MULTIPLIER_APPLIED = 'XP_MULTIPLIER_APPLIED',
    TOTAL_XP_GAINED = 'TOTAL_XP_GAINED',
    LEVEL_UP = 'LEVEL_UP',
    PRESTIGE_EARNED = 'PRESTIGE_EARNED',
    FLIP_BUCKS_EARNED = 'FLIP_BUCKS_EARNED',
    EARNED_CATALOG_ITEM = 'EARNED_CATALOG_ITEM',
}