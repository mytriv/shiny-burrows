import { parseLevel } from '../../core/levels';
import { type Move, type TileKind } from '../../core/model';
const rows = [
  '##########',
  '#..g...GE#',
  '#..d#...##',
  '#..d#.B.##',
  '#...#...##',
  '#.S.#.F.##',
  '#G..#...##',
  '##########',
];
const legend: Record<string, TileKind> = { '#': 'bedrock', '.': 'empty', d: 'dirt', g: 'gold_dirt', G: 'gem', B: 'boulder', F: 'fragile', E: 'exit', S: 'secret_entrance' };
export const firstDig = parseLevel({
  id: '01_first_dig', name: 'First Dig', biome: 'soil', width: 10, height: 8,
  cells: rows.flatMap(row => [...row].map(symbol => ({ kind: legend[symbol] }))),
  spawn: { x: 1, y: 1 }, exit: { x: 8, y: 1 }, treasureGoal: 1,
  medalThresholds: { silver: 4, gold: 7 },
  hint: 'Dig gold on the upper path. Explore the left nook for a secret. Rocks fall after a turn.',
});
export const bronzeSolution: readonly Move[] = Array.from({ length: 7 }, () => 'MoveRight');
export const goldSolution: readonly Move[] = [
  'MoveDown', 'MoveDown', 'MoveDown', 'MoveDown', 'MoveRight', 'MoveDown', 'MoveLeft',
  'MoveUp', 'MoveUp', 'MoveUp', 'MoveUp', 'MoveUp', ...bronzeSolution,
];
