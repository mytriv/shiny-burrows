import type {GameState,Vec2} from './model';
export const WALK_TICKS=12,CLIMB_TICKS=12,FALL_TICKS=6;
export const playerCell=(s:Pick<GameState,'player'>):Vec2=>({x:Math.floor(s.player.position.x/32),y:Math.round(s.player.position.y/32)-1});
export const feetAt=(c:Vec2):Vec2=>({x:c.x*32+16,y:(c.y+1)*32});
export const traversing=(s:GameState):boolean=>!!s.traversal&&s.tick<s.traversal.startedTick+s.traversal.ticks;
