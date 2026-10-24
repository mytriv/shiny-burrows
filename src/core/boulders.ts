import {ROCK_WARNING_TICKS} from './constants';
import type {GameEvent,GameState,StepResult} from './model';
import {cellBox,overlaps,playerBox,rockBox} from './world';
import {FALL_TICKS} from './traversal';
/** Deterministic bottom-first cell descent; warnings, stacks and fragile impacts stay authoritative. */
export function stepBoulders(s:GameState):StepResult {
 const rocks=s.boulders.map(b=>({...b})),events:GameEvent[]=[];let tiles=s.tiles;
 const order=rocks.map((_,i)=>i).sort((a,b)=>(rocks[b]?.position.y??0)-(rocks[a]?.position.y??0)||(rocks[a]?.position.x??0)-(rocks[b]?.position.x??0)||(rocks[a]?.id??'').localeCompare(rocks[b]?.id??''));
 for(const i of order){
  let b=rocks[i];if(!b)continue;if(s.tick<(b.nextFallTick??0))continue;const below={x:b.position.x/32,y:b.position.y/32+1},index=below.y*s.level.width+below.x,tile=tiles[index];
  if(tile?.kind==='fragile'&&(b.fallDistance??0)>0){const copy=tiles.slice();copy[index]={kind:'empty'};tiles=copy;events.push({type:'BoulderImpact',id:b.id,at:{x:below.x*32,y:below.y*32}},{type:'TileBroken',cell:below,rockId:b.id});continue;}
  const blocked=tile?.kind!=='empty'||rocks.some((other,j)=>j!==i&&overlaps(rockBox(other.position),cellBox(below)));
  if(blocked){if(b.falling)events.push({type:'BoulderImpact',id:b.id,at:{x:b.position.x,y:b.position.y+32}});rocks[i]={...b,falling:false,warningTicks:0,velocityY:0,fallDistance:0};continue;}
  if(!b.falling){b={...b,falling:true,warningTicks:ROCK_WARNING_TICKS,fallDistance:0};events.push({type:'BoulderReleased',id:b.id});}
  if(b.warningTicks>0){rocks[i]={...b,warningTicks:b.warningTicks-1};continue;}
  if(s.tick<(b.nextFallTick??0)){rocks[i]=b;continue;}
  const position={x:b.position.x,y:b.position.y+32};
  if(overlaps(rockBox(position),playerBox(s.player.position))){events.push({type:'PlayerCrushed',id:b.id});return {state:{...s,tiles,boulders:rocks,status:'failed',player:{...s.player,alive:false}},events};}
  rocks[i]={...b,position,fallFrom:b.position,velocityY:32*60/FALL_TICKS,nextFallTick:s.tick+FALL_TICKS,fallDistance:(b.fallDistance??0)+32};
  events.push({type:'BoulderMoved',id:b.id,from:b.position,to:position});
 }
 return {state:{...s,tiles,boulders:rocks},events};
}
