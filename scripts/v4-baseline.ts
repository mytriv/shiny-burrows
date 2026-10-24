// Explicit developer utility; never runs during tests or game startup.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { adventureLevels } from '../src/content/levels/first-burrow';
import { createState } from '../src/core/levels';
import { solve } from '../tests/levels/v3-routes';
const snapshots = adventureLevels.flatMap((level, index) => [1, 2, 3].map(power => {
    const state = solve(createState(level, 0, power), index);
    return { level: level.id, power, tick: state.tick, wallet: state.wallet, sha256: createHash('sha256').update(JSON.stringify(state)).digest('hex') };
}));
writeFileSync('docs/v0.4-replay-baseline.json', JSON.stringify(snapshots, null, 2) + '\n');
