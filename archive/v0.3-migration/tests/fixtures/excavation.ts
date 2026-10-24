import { sandbox } from './sandbox';
import { type LevelDefinition } from '../../src/core/model';
export const excavation: LevelDefinition = {
  ...sandbox, id: 'excavation-sandbox', name: 'Excavation Sandbox', treasureQuota: 5,
  tiles: sandbox.tiles.map((t, i) => i === 4 * 22 + 3 ? { kind: 'ore_soil', lootId: 'ore-start', lootValue: 5 } : i === 5 * 22 + 2 ? { kind: 'soil' } : t),
  overlays: [{ id: 'nook', kind: 'secret', cell: { x: 2, y: 12 }, value: 3 }, { id: 'exit', kind: 'exit', cell: { x: 6, y: 4 }, value: 0 }],
};

