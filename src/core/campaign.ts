import { BALANCE } from './config';
import { createState } from './levels';
import type { GameState, LevelDefinition } from './model';
export type Campaign = Readonly<{
    version: 1;
    levelIndex: number;
    wallet: number;
    pickaxeTier: number;
    completed: readonly string[];
    phase: 'playing' | 'surface' | 'finished';
}>;
export function newCampaign(): Campaign { return { version: 1, levelIndex: 0, wallet: 0, pickaxeTier: 0, completed: [], phase: 'playing' }; }
export function startLevel(c: Campaign, levels: readonly LevelDefinition[]): GameState {
    const level = levels[c.levelIndex];
    if (c.phase !== 'playing' || !level || c.completed.includes(level.id))
        throw new Error('No uncompleted level');
    return createState(level, c.wallet, BALANCE.pickaxePowers[c.pickaxeTier] ?? 1);
}
export function finishLevel(c: Campaign, s: GameState, levels: readonly LevelDefinition[]): Campaign {
    if (c.phase !== 'playing' || s.status !== 'won' || levels[c.levelIndex]?.id !== s.level.id || c.completed.includes(s.level.id))
        return c;
    return { ...c, wallet: s.wallet, completed: [...c.completed, s.level.id], phase: c.levelIndex === levels.length - 1 ? 'finished' : 'surface' };
}
export function upgrade(c: Campaign): Campaign {
    const cost = BALANCE.upgradePrices[c.pickaxeTier];
    if (c.phase !== 'surface' || cost === undefined || c.wallet < cost)
        return c;
    return { ...c, wallet: c.wallet - cost, pickaxeTier: c.pickaxeTier + 1 };
}
export function nextLevel(c: Campaign): Campaign { return c.phase === 'surface' ? { ...c, levelIndex: c.levelIndex + 1, phase: 'playing' } : c; }
