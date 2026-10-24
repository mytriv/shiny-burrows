import { expect, it } from 'vitest';
import { firstDig, bronzeSolution, goldSolution } from '../../src/content/levels/first-dig';
import { createState } from '../../src/core/levels';
import { applyAction } from '../../src/core/reducer';
import { medal } from '../../src/core/scoring';
it.each([['direct', bronzeSolution, 'silver'], ['secret detour', goldSolution, 'gold']] as const)('sample level: %s solution is legal and wins', (_, moves, reward) => {
  let state = createState(firstDig);
  for (const move of moves) { const result = applyAction(state, move); expect(result.accepted).toBe(true); state = result.state; }
  expect(state.status).toBe('won'); expect(medal(state)).toBe(reward);
  if (reward === 'gold') expect(state.secretVisited).toBe(true);
});
