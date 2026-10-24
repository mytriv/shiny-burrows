import {ladderAt,ladderTops,sameCell} from './ladders';
import type {GameState,InputIntent,StepResult,GameEvent,Vec2} from './model';
import {cellBox,overlaps,rockBox} from './world';
import {playerCell,feetAt,traversing,WALK_TICKS,CLIMB_TICKS,FALL_TICKS} from './traversal';
/** One committed adjacent cell at a time. Fractional movement exists only in presentation. */
export function movePlayer(s:GameState,input:InputIntent):StepResult {
 const p=s.player,c=playerCell(s),events:GameEvent[]=[],at=(cell:Vec2)=>s.tiles[cell.y*s.level.width+cell.x];
 if(p.position.x!==c.x*32+16||p.position.y!==(c.y+1)*32)throw new Error('Player must occupy one grid cell');
 if(traversing(s))return {state:input.downPressed&&s.traversal?{...s,traversal:{...s.traversal,dropRequested:true}}:s,events,motionPath:[p.position]};
 const ignored=s.ignoredPlatforms.filter(b=>b.y>c.y),below={x:c.x,y:c.y+1};
 const platform=s.platforms.some(b=>sameCell(b,below)&&!ignored.some(i=>sameCell(i,b)));
 const top=ladderTops(s).some(b=>sameCell(b,below));
 const solid=(cell:Vec2)=>!!at(cell)&&at(cell)?.kind!=='empty'||s.boulders.some(b=>overlaps(rockBox(b.position),cellBox(cell)));
 const ground=solid(below)||platform||top;
 const drop=!!(input.downPressed||s.traversal?.dropRequested)&&(platform||top);
 const grip=!drop&&(p.climbing||!!input.climbY)&&!!ladderAt(s)&&!ignored.length;
 let target:Vec2|undefined,kind:'walk'|'climb'|'fall'='walk';
 if(drop||!ground&&!grip){target=below;kind='fall';}
 else if(input.moveX){target={x:c.x+input.moveX,y:c.y};}
 else if(input.climbY&&grip&&!(input.climbY>0&&platform&&!drop)){
  const next={x:c.x,y:c.y+input.climbY},highest=ladderTops(s).find(t=>t.x===c.x)?.y??c.y;
  const rung=s.ladders.some(l=>sameCell(l,next)),connector=s.platforms.some(b=>sameCell(b,next))&&!!ladderAt({...s,player:{...p,position:feetAt(next)}});
  if(input.climbY>0||rung||connector||next.y===highest-1){target=next;kind='climb';}
 }
 const dropping=drop&&platform?[...ignored,...s.platforms.filter(b=>sameCell(b,below))]:ignored;
 const stationary:GameState={...s,traversal:null,ignoredPlatforms:dropping,player:{...p,velocity:{x:0,y:0},grounded:ground&&!drop,climbing:grip,facing:input.moveX||p.facing}};
 if(!target)return {state:stationary,events,motionPath:[p.position]};
 if(target.x<0||target.x>=s.level.width||target.y<0||target.y>=s.level.height){
  if(target.y>=s.level.height){events.push({type:'PlayerFell'});return {state:{...stationary,status:'failed',player:{...stationary.player,alive:false}},events};}
  return {state:stationary,events};
 }
 if(solid(target))return {state:stationary,events,motionPath:[p.position]};
 const position=feetAt(target),ticks=kind==='fall'?FALL_TICKS:kind==='climb'?CLIMB_TICKS:WALK_TICKS;
 const nextGrip=kind!=='fall'&&grip&&!!ladderAt({...stationary,player:{...p,position}});
 const nextBelow={x:target.x,y:target.y+1},nextGround=solid(nextBelow)||s.platforms.some(b=>sameCell(b,nextBelow)&&!dropping.some(i=>sameCell(i,b)))||!drop&&ladderTops(s).some(b=>sameCell(b,nextBelow));
 if(kind==='fall'&&nextGround)events.push({type:'Landed'});
 return {state:{...stationary,traversal:{from:p.position,startedTick:s.tick,ticks,kind},player:{...stationary.player,position,climbing:nextGrip,grounded:nextGround,velocity:{x:(position.x-p.position.x)*60/ticks,y:(position.y-p.position.y)*60/ticks}}},events,motionPath:[p.position,position]};
}
