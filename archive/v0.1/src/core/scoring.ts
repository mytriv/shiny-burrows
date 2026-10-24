import { type GameState } from './model';
export function medal(state: GameState): 'bronze' | 'silver' | 'gold' | null {
  if (state.status !== 'won') return null;
  return state.collectedValue >= state.level.medalThresholds.gold ? 'gold'
    : state.collectedValue >= state.level.medalThresholds.silver ? 'silver' : 'bronze';
}
export const treasurePercent = (state: GameState): number => state.totalTreasureValue === 0 ? 100 : Math.floor(100 * state.collectedValue / state.totalTreasureValue);
