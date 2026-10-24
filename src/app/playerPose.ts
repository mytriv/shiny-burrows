import type {GameState,Vec2} from '../core/model';
/** Visual-only interpolation of one committed cell; never feeds back into Core. */
export function playerPose(s:GameState,alpha:number):Vec2 {
 const move=s.traversal;if(!move)return s.player.position;
 const t=Math.max(0,Math.min(1,(s.tick-1+alpha-move.startedTick)/move.ticks)),ease=t*t*(3-2*t);
 return {x:move.from.x+(s.player.position.x-move.from.x)*ease,y:move.from.y+(s.player.position.y-move.from.y)*ease};
}
