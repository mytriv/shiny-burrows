import {expect,it} from 'vitest';
import {createState} from '../../src/core/levels';
import {stepGame} from '../../src/core/simulation';
import {IDLE,type GameState,type GameEvent,type InputIntent,type Tile} from '../../src/core/model';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {ladderAt} from '../../src/core/ladders';
function fixture(side:-1|1,kind:Tile['kind']='soil',feet=190):GameState{
 const row=Math.floor((feet-13)/32),column=3+side;
 const tiles:Tile[]=firstBurrow.tiles.map(()=>({kind:'empty'}));
 tiles[row*16+column]=kind==='ore_soil'?{kind,hardness:2,lootId:'side-gold',lootValue:7}:{kind};
 const s=createState({...firstBurrow,tiles,goldHints:[],overlays:[],treasureQuota:0,spawn:{x:112,y:feet}});
 return {...s,ladders:[4,5,6,7].map(y=>({x:3,y})),player:{...s.player,climbing:true}};
}
function run(initial:GameState,count:number,input:Partial<InputIntent>={}){let s=initial;const events:GameEvent[]=[];for(let i=0;i<count;i++){const r=stepGame(s,{...IDLE,...input});s=r.state;events.push(...r.events);}return {state:s,events};}
for(const side of [-1,1] as const){
 it(`${side}: held dirt mining preserves exact height/grip and two-hit cadence`,()=>{
  const start=fixture(side),r=run(start,29,{moveX:side});
  const hits=r.events.filter(e=>e.type==='TileHit');expect(hits).toHaveLength(2);
  expect(r.state.player.position.y).toBe(start.player.position.y);expect(r.state.player.climbing).toBe(true);
  expect(r.state.player.velocity.y).toBe(0);expect(r.state.ladders).toEqual(start.ladders);expect(r.state.ladderProcessedCells).toEqual([]);
 });
 it(`${side}: first-hit release and interrupted cooldown retain stationary grip`,()=>{
  const initial=fixture(side),first=run(initial,5,{moveX:side});expect(first.events.filter(e=>e.type==='TileHit')).toHaveLength(1);
  const p=first.state.player.position,idle=run(first.state,12);expect(idle.state.player.position).toEqual(p);expect(idle.state.player.climbing).toBe(true);
  const resumed=run(idle.state,1,{moveX:side});expect(resumed.events.filter(e=>e.type==='TileHit')).toEqual([]);
  expect(run(resumed.state,20).state.player.position).toEqual(p);
 });
 it(`${side}: releasing on destruction holds, continuing moves only until actual support loss`,()=>{
  const initial=fixture(side);let s=initial;
  for(let i=0;i<60;i++){const r=stepGame(s,{...IDLE,moveX:side});s=r.state;if(r.events.some(e=>e.type==='TileDug'))break;}
  expect(s.player.climbing).toBe(true);const atBreak=s.player.position;
  const released=run(s,60).state;expect(released.player.position).toEqual(atBreak);expect(released.player.climbing).toBe(true);
  let moved=false,detached=false;
  for(let i=0;i<30;i++){
   const before=s;s=stepGame(s,{...IDLE,moveX:side}).state;
   moved ||= s.player.position.x!==before.player.position.x;
   if(ladderAt(s)){expect(s.player.climbing).toBe(true);expect(s.player.position.y).toBe(atBreak.y);}
   else {expect(s.player.climbing).toBe(false);expect(s.player.position.y).toBeGreaterThan(atBreak.y);detached=true;break;}
   expect(s.ladders).toEqual(initial.ladders);
  }
  expect(moved).toBe(true);expect(detached).toBe(true);expect(s.ladderProcessedCells).toEqual([]);
 });
 for(const kind of ['hard','ore_soil'] as const)it(`${side}: ${kind} mines while suspended without falling or extra ladders`,()=>{
  const initial=fixture(side,kind);let s=initial;const hits:number[]=[];let dug=false;
  for(let i=0;i<130;i++){const r=stepGame(s,{...IDLE,moveX:side});s=r.state;if(r.events.some(e=>e.type==='TileHit'))hits.push(s.tick);
   expect(s.player.climbing).toBe(true);expect(s.player.position.y).toBe(initial.player.position.y);expect(s.ladders).toEqual(initial.ladders);
   if(r.events.some(e=>e.type==='TileDug')){dug=true;break;}}
  expect(dug).toBe(true);expect(hits).toHaveLength(kind==='hard'?5:3);for(let i=1;i<hits.length;i++)expect((hits[i]??0)-(hits[i-1]??0)).toBe(24);
  expect(s.wallet).toBe(kind==='ore_soil'?7:0);
 });
}
it('empty horizontal movement keeps grip within tolerance and applies gravity only outside support',()=>{
 const base=fixture(1),s={...base,tiles:base.tiles.map(()=>({kind:'empty' as const}))};
 const near=run(s,7,{moveX:1}).state;expect(near.player.position.x).toBeGreaterThan(s.player.position.x);expect(near.player.position.y).toBe(s.player.position.y);expect(near.player.climbing).toBe(true);
 const idle=run(near,30).state;expect(idle.player.position).toEqual(near.player.position);
 const away=run(idle,1,{moveX:1}).state;expect(away.player.climbing).toBe(false);expect(away.player.position.y).toBeGreaterThan(idle.player.position.y);expect(away.ladders).toEqual(s.ladders);
});
for(const side of [-1,1] as const){
 for(const feet of [163.5,175,190,198.75])it(`${side}: suspended dirt at height ${feet} remains exactly two hits at every upgrade`,()=>{
  for(const power of [1,2,3]){const start={...fixture(side,'soil',feet),pickaxePower:power},r=run(start,29,{moveX:side});expect(r.events.filter(e=>e.type==='TileHit')).toHaveLength(2);expect(r.state.player.position.y).toBe(feet);expect(r.state.player.climbing).toBe(true);}
 });
 it(`${side}: a block touching only the feet or head is mined rather than losing grip`,()=>{
  for(const [feet,row] of [[198,6],[182,4]] as const){const base=fixture(side,'soil',feet),tiles=base.tiles.map(()=>({kind:'empty' as const} as Tile));tiles[row*16+3+side]={kind:'soil',maxIntegrity:2,currentIntegrity:2};
   const r=run({...base,tiles},29,{moveX:side});expect(r.events.filter(e=>e.type==='TileHit')).toHaveLength(2);expect(r.state.tiles[row*16+3+side]?.kind).toBe('empty');expect(r.state.player.position.y).toBe(feet);expect(r.state.player.climbing).toBe(true);
  }
 });
 it(`${side}: interrupted damage regenerates without falling; bedrock blocks without detachment`,()=>{
  const initial=fixture(side),first=run(initial,5,{moveX:side}),rest=run(first.state,181).state;
  expect(rest.player.position).toEqual(first.state.player.position);expect(rest.tiles[5*16+3+side]?.currentIntegrity).toBe(2);expect(rest.player.climbing).toBe(true);
  const rock=run(fixture(side,'bedrock'),90,{moveX:side});expect(rock.events.filter(e=>e.type==='TileHit')).toEqual([]);expect(rock.state.player.position.y).toBe(initial.player.position.y);expect(rock.state.player.climbing).toBe(true);
 });
}
it('consecutive side blocks transition from suspended digging to supported tunnel mining, with interruption',()=>{
 const initial=fixture(1),tiles=initial.tiles.slice();tiles[5*16+5]={kind:'soil',maxIntegrity:2,currentIntegrity:2};
 for(let x=4;x<16;x++)tiles[6*16+x]={kind:'stone'};
 let s=run({...initial,tiles},5,{moveX:1}).state;s=run(s,10).state;expect(s.player.climbing).toBe(true);
 const r=run(s,160,{moveX:1});expect(r.state.tiles[5*16+4]?.kind).toBe('empty');expect(r.state.tiles[5*16+5]?.kind).toBe('empty');
 expect(r.events.filter(e=>e.type==='TileHit')).toHaveLength(3);expect(r.state.ladders).toEqual(initial.ladders);expect(r.state.ladderProcessedCells).toEqual([]);
});
