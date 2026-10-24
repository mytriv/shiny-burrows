import { createState } from '../../src/core/levels';
import { firstBurrow } from '../../src/content/levels/first-burrow';
import { IDLE, type GameEvent, type GameState, type InputIntent } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
export class Replay {
  state = createState(firstBurrow);
  inputs: InputIntent[] = [];
  events: GameEvent[] = [];
  step(n = 1, input: Partial<InputIntent> = {}): this {
    for (let i = 0; i < n; i++) { const intent = { ...IDLE, ...input }; const r = stepGame(this.state, intent); const rejected = r.events.find(e => e.type === 'ActionRejected'); if (rejected) throw new Error(`${JSON.stringify(rejected)} at ${JSON.stringify(this.state.player)} tick ${this.state.tick} next ${this.state.nextDigTick}`); this.state = r.state; this.inputs.push(intent); this.events.push(...r.events); }
    return this;
  }
  until(predicate: (s: GameState) => boolean, input: Partial<InputIntent> = {}, limit = 800): this {
    for (let i = 0; !predicate(this.state); i++) { if (i >= limit) throw new Error(`Route timed out: ${JSON.stringify(this.state.player)}`); this.step(1, input); } return this;
  }
  walk(x: number): this { const moveX = x > this.state.player.position.x ? 1 : -1; return this.until(s => moveX > 0 ? s.player.position.x >= x : s.player.position.x <= x, { moveX }); }
  down(): this { const before = this.state.player.position.y; return this.step(1, { digPressed: true, digDirection: 'down' }).until(s => s.player.grounded && s.player.position.y > before); }
}
function exitTunnel(r: Replay): Replay {
  for (const x of [19, 21]) r.walk(x * 32 - 10).step(1, { digPressed: true, digDirection: 'right' }).step(10);
  return r.until(s => s.status === 'won', { moveX: 1 });
}
export function paidRoute(): Replay {
  const r = new Replay().step().step(1, { digPressed: true }).step(1, { buyBridgePressed: true }).step(1, { buyBridgePressed: true }).walk(240)
    .step(1, { placeBridgePressed: true }).walk(272).step(1, { placeBridgePressed: true }).walk(566)
    .step(1, { digPressed: true, digDirection: 'right' }).walk(656);
  for (let row = 5; row <= 14; row++) r.down();
  // At x20 the first exit-tunnel wall (x19) is behind us; only dig x21.
  return r.walk(662).step(1, { digPressed: true, digDirection: 'right' }).until(s => s.status === 'won', { moveX: 1 });
}
export function freeRoute(secret = false, sideVein = false): Replay {
  const r = new Replay().step().step(1, { digPressed: true }).walk(176);
  for (let row = 5; row <= 11; row++) r.down();
  if (secret) {
    r.step(1, { digPressed: true, digDirection: 'left' }).step(90).until(s => s.discoveredSecrets.length > 0, { moveX: -1 }).until(s => s.player.grounded)
      .step(1, { jumpPressed: true, moveX: 1 }).walk(176).until(s => s.player.grounded);
  }
  r.down();
  for (const x of [6, 7, 8, 9, 13, 14, 15]) {
    r.walk(x * 32 - 10).step(1, { digPressed: true, digDirection: 'right' }).step(10);
    if (x === 14 && sideVein) r.walk(464).step(1, { digPressed: true, digDirection: 'up' }).step(10).step(1, { jumpPressed: true }).step(12).step(1, { digPressed: true, digDirection: 'up' }).until(s => s.player.grounded);
  }
  r.walk(592).down().down();
  return exitTunnel(r);
}
