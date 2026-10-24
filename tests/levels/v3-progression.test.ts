import { integrity } from '../../src/core/config';
import { expect, it } from 'vitest';
import { adventureLevels, firstBurrow } from '../../src/content/levels/first-burrow';
import { createState } from '../../src/core/levels';
import { newCampaign, startLevel, finishLevel, nextLevel, upgrade } from '../../src/core/campaign';
import { solve } from './v3-routes';
import { GameController } from '../../src/app/GameController';
import { IDLE } from '../../src/core/model';
import { DT } from '../../src/core/constants';
it('all three authored levels solve with base power, no spending or jumps', () => { for (let index = 0; index < 3; index++) {
    const s = solve(createState(adventureLevels[index] ?? firstBurrow), index);
    expect(s.status).toBe('won');
    expect(s.spentCoins).toBe(0);
    expect(s.levelGoldCollected).toBeGreaterThanOrEqual(s.level.treasureQuota);
    expect(s.wallet).toBe(s.levelGoldCollected);
    console.info(s.level.name + ' base route: ' + s.tick + ' ticks / ' + (s.tick / 60).toFixed(1) + 's');
} });
it('First Burrow paid convenience route and free route both finish, cost stays meaningful', () => { const free = solve(createState(firstBurrow), 0), paid = solve(createState(firstBurrow), 0, true); expect(paid.status).toBe('won'); expect(paid.platforms).toHaveLength(1); expect(paid.spentCoins).toBe(5); expect(paid.levelGoldCollected).toBe(free.levelGoldCollected + 6); expect(paid.wallet).toBe(paid.levelGoldCollected - 5); });
it('later levels increase hardness and gold value; upgrade reduces hits without blocking base route', () => { const stats = adventureLevels.map(l => ({ hard: l.tiles.reduce((total,t)=>total+integrity(t),0)/l.tiles.filter(t=>integrity(t)>0).length, gold: Math.max(...l.tiles.map(t => t.lootValue ?? 0)) })); expect(stats[1]?.hard).toBeGreaterThan(stats[0]?.hard ?? 0); expect(stats[2]?.hard).toBeGreaterThan(stats[1]?.hard ?? 0); expect(stats[2]?.gold).toBeGreaterThan(stats[1]?.gold ?? 0); const slow = solve(createState(adventureLevels[2]), 2), fast = solve(createState(adventureLevels[2], 0, 3), 2); expect(fast.tick).toBeLessThan(slow.tick); expect(fast.wallet).toBe(slow.wallet); });
it('campaign completion commits once, upgrade is atomic and transitions carry wallet/power', () => { let c = newCampaign(); for (let i = 0; i < 3; i++) {
    const s = solve(startLevel(c, adventureLevels), i);
    const before = c.wallet;
    c = finishLevel(c, s, adventureLevels);
    expect(c.wallet).toBe(before + s.levelGoldCollected);
    expect(finishLevel(c, s, adventureLevels)).toBe(c);
    if (i < 2) {
        const old = c;
        c = upgrade(c);
        expect(c.wallet).toBe(old.wallet - (i === 0 ? 8 : 20));
        expect(c.pickaxeTier).toBe(i + 1);
        c = nextLevel(c);
        expect(startLevel(c, adventureLevels).pickaxePower).toBe(i + 2);
    }
} expect(c.phase).toBe('finished'); expect(c.completed).toHaveLength(3); expect(upgrade(c)).toBe(c); });
it('cannot upgrade while playing, with insufficient funds, or past tier cap', () => { const c = newCampaign(); expect(upgrade(c)).toBe(c); for (const wallet of [0, 7]) {
    const s = { ...c, phase: 'surface' as const, wallet };
    expect(upgrade(s)).toBe(s);
} const capped = { ...c, phase: 'surface' as const, wallet: 100, pickaxeTier: 2 }; expect(upgrade(capped)).toBe(capped); });
it('retry resets entry wallet/resources/power; no persistent reward farming or completed replay', () => { const c = new GameController(firstBurrow, adventureLevels); c.state = { ...c.state, wallet: 999, levelGoldCollected: 999, pickaxePower: 3 }; c.restart(); expect(c.state.wallet).toBe(0); expect(c.state.pickaxePower).toBe(1); expect(c.campaign?.wallet).toBe(0); c.state = solve(c.state, 0); c.state = { ...c.state, status: 'playing' }; c.queue(IDLE); c.advance(DT); expect(c.campaign?.phase).toBe('surface'); const won = c.state; c.restart(); expect(c.state).toBe(won); c.buyUpgrade(); const wallet = c.campaign?.wallet; c.continue(); expect(c.state.wallet).toBe(wallet); c.state = { ...c.state, wallet: 999 }; c.restart(); expect(c.state.wallet).toBe(wallet); c.newAdventure(); expect(c.campaign).toEqual(newCampaign()); expect(c.state.wallet).toBe(0); });
