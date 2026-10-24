import {expect,it} from 'vitest';
import {createState} from '../../src/core/levels';
import {stepGame} from '../../src/core/simulation';
import {IDLE,type GameState,type InputIntent,type Tile,type LevelDefinition,type DigDirection,type GameEvent} from '../../src/core/model';
import {addLadders,traceLadders} from '../../src/core/ladders';
import {GameController} from '../../src/app/GameController';
import {DT} from '../../src/core/constants';
import {playerBox,playerSolids,overlaps} from '../../src/core/world';
const w=9,h=16;
it('standing Up has normal cadence, release cancellation, gold payout and no free ladder or ascent',()=>{
 const f=contact('up','soil',1,true);let s:GameState={...f.state,ladders:[],player:{...f.state.player,position:{x:112,y:224}}};
 s=ticks(s,1,f.input).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(2);expect(s.player.position.y).toBe(224);
 s=ticks(s,23,f.input).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(2);
 s=ticks(s,1,f.input).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(1);
 s=ticks(s,1).state;expect(s.miningContact).toBe(null);s=ticks(s,23).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(1);
 s=ticks(s,25,f.input).state;expect(s.tiles[f.index]?.kind).toBe('empty');expect(s.wallet).toBe(7);
 s=ticks(s,180,f.input).state;expect(s.wallet).toBe(7);expect(s.player.position.y).toBe(224);expect(s.ladders).toEqual([]);
});
it('Up can strike during a reachable fall, but cannot strike a ceiling beyond pickaxe reach',()=>{
 const f=contact('up');const tiles=f.state.tiles.map((t,i)=>Math.floor(i/w)===7?{kind:'empty' as const}:t);
 let s:GameState={...f.state,tiles,ladders:[],player:{...f.state.player,position:{x:112,y:224},grounded:false,velocity:{x:0,y:20}}};
 const r=ticks(s,1,f.input);expect(r.events.some(e=>e.type==='TileHit')).toBe(true);expect(r.state.player.position.y).toBeGreaterThan(224);expect(r.state.player.climbing).toBe(false);
 s={...s,player:{...s.player,position:{x:112,y:227}}};expect(ticks(s,1,f.input).events.some(e=>e.type==='TileHit')).toBe(false);
});
it('releasing Up holds exact ladder position and stops mining; Up alone resumes automatic ceiling mining',()=>{
 const f=contact('up');let s=ticks(f.state,1,f.input).state;
 expect(s.tiles[f.index]?.currentIntegrity).toBe(1);
 const position=s.player.position,ladders=s.ladders;
 s=ticks(s,60).state;
 expect(s.player.position).toEqual(position);expect(s.player.velocity).toEqual({x:0,y:0});expect(s.player.climbing).toBe(true);
 expect(s.ladders).toEqual(ladders);expect(s.tiles[f.index]?.currentIntegrity).toBe(1);expect(s.miningContact).toBe(null);
 s=ticks(s,25,f.input).state;expect(s.tiles[f.index]?.kind).toBe('empty');
});
it('idle grip preserves off-center position; sideways input or losing the ladder restores gravity',()=>{
 const f=contact('up');const s:GameState={...f.state,player:{...f.state.player,position:{x:117,y:224},climbing:true},tiles:f.state.tiles.map((t,i)=>Math.floor(i/w)===7?{kind:'empty'}:t)};
 const held=ticks(s,120).state;expect(held.player.position).toEqual(s.player.position);
 const detached=ticks(held,1,{moveX:1}).state;expect(detached.player.climbing).toBe(false);expect(detached.player.position.y).toBeGreaterThan(held.player.position.y);
 const missing=ticks({...held,ladders:[]},1).state;expect(missing.player.climbing).toBe(false);expect(missing.player.position.y).toBeGreaterThan(held.player.position.y);
});
it('releasing Down holds mid-shaft; intentional platform drop overrides an established grip',()=>{
 let s=ticks(createState(level()),180).state;s=ticks(s,20,{climbY:-1}).state;s=ticks(s,5,{climbY:1}).state;
 const position=s.player.position;expect(ticks(s,120).state.player.position).toEqual(position);
 s={...s,platforms:[{x:3,y:4}],ladders:[{x:3,y:3}],player:{...s.player,position:{x:112,y:128},grounded:true,climbing:true}};
 const dropped=ticks(s,1,{climbY:1,downPressed:true}).state;expect(dropped.player.climbing).toBe(false);expect(dropped.player.position.y).toBeGreaterThan(128);
});
function level():LevelDefinition {return {id:'g-fixture',name:'G fixture',depth:0,width:w,height:h,spawn:{x:112,y:224},killY:h*32,startWallet:0,treasureQuota:0,overlays:[],boulders:[],tiles:Array.from({length:w*h},(_,i)=>({kind:i%w===0||i%w===8||Math.floor(i/w)===15?'bedrock':'empty'}))};}
function ticks(s:GameState,n:number,input:Partial<InputIntent>={}){const events:GameEvent[]=[];for(let i=0;i<n;i++){const r=stepGame(s,{...IDLE,...input});s=r.state;events.push(...r.events);}return {state:s,events};}
function contact(direction:DigDirection,kind:Tile['kind']='soil',power=1,gold=false){const l=level();const cell=direction==='up'?{x:3,y:5}:direction==='down'?{x:3,y:7}:direction==='left'?{x:2,y:6}:{x:4,y:6};const spawn=direction==='up'?{x:112,y:218}:direction==='right'?{x:118,y:224}:direction==='left'?{x:106,y:224}:{x:112,y:224};const tile:Tile=gold?{kind:'ore_soil',hardness:kind==='hard'?5:kind==='soil'?2:3,lootId:'gold',lootValue:7}:{kind};const tiles=l.tiles.map((t,i)=>Math.floor(i/w)===7?{kind:'bedrock' as const}:t);tiles[cell.y*w+cell.x]=tile;let s=createState({...l,spawn,tiles},0,power);if(direction==='up')s={...s,ladders:[{x:3,y:6}]};s=ticks(s,1).state;return {state:s,cell,index:cell.y*w+cell.x,input:{...IDLE,moveX:direction==='left'?-1:direction==='right'?1:0,climbY:direction==='up'?-1:direction==='down'?1:0} as InputIntent};}
for(const direction of ['left','right','up','down'] as const){
 it(direction+' auto-digs with the same first/second hit ticks and no manual Dig',()=>{const f=contact(direction);let r=ticks(f.state,1,f.input);expect(r.events.filter(e=>e.type==='TileHit')).toHaveLength(1);expect(r.state.tiles[f.index]?.currentIntegrity).toBe(1);r=ticks(r.state,23,f.input);expect(r.state.tiles[f.index]?.kind).toBe('soil');r=ticks(r.state,1,f.input);expect(r.events.filter(e=>e.type==='TileDug')).toHaveLength(1);expect(r.state.tiles[f.index]?.kind).toBe('empty');});
 it(direction+' preserves two-hit minimum and exact gold +1 at every power',()=>{for(const power of [1,2,3,20])for(const kind of ['soil','compacted','hard'] as const){const plain=contact(direction,kind,power),gold=contact(direction,kind,power,true);const a=ticks(plain.state,220,plain.input),b=ticks(gold.state,220,gold.input);const count=(r:typeof a)=>r.events.filter(e=>e.type==='TileHit'&&e.cell.x===plain.cell.x&&e.cell.y===plain.cell.y).length;expect(count(a)).toBe(Math.max(2,Math.ceil((kind==='soil'?2:kind==='hard'?5:3)/power)));expect(count(b)).toBe(count(a)+1);expect(b.state.wallet).toBe(7);}});
}
it('Down alone continuously excavates several layers and adds only actually traversed ladders',()=>{const l=level(),tiles=l.tiles.map((t,i)=>i%w===3&&[7,8,9].includes(Math.floor(i/w))?{kind:'soil' as const}:t);let s=createState({...l,tiles});s=ticks(s,1).state;const first=ticks(s,25,{climbY:1});expect(first.state.tiles[7*w+3]?.kind).toBe('empty');expect(first.state.ladders).toEqual([]);s=ticks(first.state,300,{climbY:1}).state;expect(s.ladders.some(c=>c.y===7)).toBe(true);expect(s.ladders.some(c=>c.y===9)).toBe(true);expect(s.player.position.y).toBe(480);s=ticks(s,320,{climbY:-1}).state;expect(s.player.position.y).toBe(192);});
it('walking off a ledge creates a free continuous return shaft in previously empty space',()=>{const l=level();const tiles=l.tiles.map((t,i)=>Math.floor(i/w)===4&&i%w!==3?{kind:'bedrock' as const}:t);let s=createState({...l,tiles,spawn:{x:80,y:128}});s=ticks(s,20,{moveX:1}).state;s=ticks(s,150).state;expect(s.player.position.y).toBe(480);for(let y=3;y<=14;y++)expect(s.ladders).toContainEqual({x:3,y});expect(s.wallet).toBe(0);s=ticks(s,360,{climbY:-1}).state;expect(s.player.position.y).toBe(96);});
it('gravity and high-speed falls ladder each crossed row without hovering, duplicates or terrain overlap',()=>{let s=createState({...level(),spawn:{x:112,y:96}});s={...s,player:{...s.player,velocity:{x:0,y:360}}};s=ticks(s,120).state;expect(s.player.position.y).toBe(480);expect(s.player.grounded).toBe(true);for(let y=2;y<=14;y++)expect(s.ladders).toContainEqual({x:3,y});expect(new Set(s.ladders.map(c=>c.x+','+c.y)).size).toBe(s.ladders.length);for(const c of s.ladders)expect(s.tiles[c.y*w+c.x]?.kind).toBe('empty');expect(ticks(s,100).state.ladders).toEqual(s.ladders);});
it('traversal enumeration covers multiple crossed cells and does not create horizontal ladders',()=>{const s=createState({...level(),spawn:{x:112,y:96}});const r=traceLadders(s,[{x:112,y:96},{x:112,y:240}]);expect(r.state.ladders.map(c=>c.y)).toEqual([2,3,4,5,6,7]);expect(traceLadders(s,[{x:80,y:96},{x:144,y:96}]).state.ladders).toEqual([]);expect(r.state.ladders.some(c=>c.y>7)).toBe(false);});
it('ladder placement refuses solids, treasure, rocks and platform structures',()=>{const l=level();const s={...createState({...l,overlays:[{id:'gem',kind:'gem' as const,value:2,cell:{x:2,y:3}}],boulders:[{id:'rock',cell:{x:4,y:3}}]}),platforms:[{x:3,y:3}]};const r=addLadders(s,[{x:0,y:3},{x:2,y:3},{x:3,y:3},{x:4,y:3}]);expect(r.state.ladders).toEqual([]);expect(r.state.wallet).toBe(0);});
it('Up mines only a reachable ladder ceiling and creates its extension only after traversal',()=>{const f=contact('up');let s=ticks(f.state,25,f.input).state;expect(s.tiles[f.index]?.kind).toBe('empty');expect(s.ladders).not.toContainEqual(f.cell);expect(s.upwardOpening).toEqual(f.cell);s=ticks(s,1,f.input).state;expect(s.ladders).toContainEqual(f.cell);expect(s.upwardOpening).toBe(null);expect(ticks(s,120,f.input).state.player.position.y).toBe(160);});
it('connected upward excavation repeats, but cannot extend freely into untouched empty sky',()=>{const f=contact('up');const tiles=f.state.tiles.map((t,i)=>i===4*w+3||i===3*w+3?{kind:'soil' as const,maxIntegrity:2,currentIntegrity:2}:t);const r=ticks({...f.state,tiles},260,{climbY:-1});for(let y=3;y<=6;y++)expect(r.state.ladders).toContainEqual({x:3,y});expect(r.state.player.position.y).toBe(96);expect(r.state.ladders).not.toContainEqual({x:3,y:2});expect(playerSolids(r.state,playerBox(r.state.player.position)).some(b=>overlaps(b,playerBox(r.state.player.position)))).toBe(false);});
it('Up without a ladder mines a tunnel ceiling without ascent; solid ceilings prevent remote reach',()=>{const f=contact('up');let s:GameState={...f.state,ladders:[],player:{...f.state.player,position:{x:112,y:224}}};s=ticks(s,180,{climbY:-1}).state;expect(s.tiles[f.index]?.kind).toBe('empty');expect(s.ladders).toEqual([]);expect(s.upwardOpening).toBe(null);expect(s.player.climbing).toBe(false);expect(s.player.position.y).toBeGreaterThanOrEqual(f.state.player.position.y);const tiles=f.state.tiles.map((t,i)=>i===f.index?{kind:'bedrock' as const}:i===4*w+3?{kind:'soil' as const,maxIntegrity:2,currentIntegrity:2}:t);const r=ticks({...f.state,tiles},180,{climbY:-1});expect(r.state.tiles[4*w+3]?.currentIntegrity).toBe(2);});
it('release/reversal interrupts all axes, partial and gold-layer damage regenerates normally',()=>{for(const direction of ['left','right','down','up'] as const){const f=contact(direction,'soil',3,true);let s=ticks(f.state,1,f.input).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(2);s=ticks(s,1).state;expect(s.miningContact).toBe(null);s=ticks(s,180).state;expect(s.tiles[f.index]?.currentIntegrity).toBe(3);}});
it('platform drop wins over existing ladders, adds a return path and re-enables Up after clearance',()=>{const l=level();let s={...createState({...l,spawn:{x:112,y:128}}),platforms:[{x:3,y:4}],ladders:[{x:3,y:3}],player:{...createState(l).player,position:{x:112,y:128},grounded:true}} as GameState;const first=stepGame(s,{...IDLE,downPressed:true,climbY:1});expect(first.state.player.climbing).toBe(false);s=ticks(first.state,220).state;expect(s.player.position.y).toBe(480);expect(s.ladders).not.toContainEqual({x:3,y:4});expect(s.ladders).toContainEqual({x:3,y:5});expect(s.ignoredPlatforms).toEqual([]);s=ticks(s,360,{climbY:-1}).state;expect(s.player.position.y).toBe(96);});
it('pause freezes movement, mining and ladder generation; restart clears openings/segments',()=>{const c=new GameController(level());c.queue({...IDLE,climbY:1});c.advance(DT*5);c.pause(true);const before=c.state;c.advance(99);expect(c.state).toBe(before);c.restart();expect(c.state.ladders).toEqual([]);expect(c.state.upwardOpening).toBe(null);});
it('30/60/120Hz display grouping and deterministic repeated falling runs have identical outcomes',()=>{const run=(n:number,dt:number)=>{const c=new GameController(level());for(let i=0;i<n;i++){c.queue({...IDLE,climbY:1});c.advance(dt);}return c.state;};expect(run(240,DT/2)).toEqual(run(120,DT));expect(run(60,DT*2)).toEqual(run(120,DT));expect(run(120,DT)).toEqual(run(120,DT));});

it('Down gently aligns an off-center mole before excavation without clipping neighboring floor',()=>{const f=contact('down');let s:GameState={...f.state,player:{...f.state.player,position:{x:122,y:224}}};for(let i=0;i<120;i++){s=stepGame(s,{...IDLE,climbY:1}).state;expect(playerSolids(s,playerBox(s.player.position)).some(b=>overlaps(b,playerBox(s.player.position)))).toBe(false);}expect(s.player.position.x).toBe(112);expect(s.player.position.y).toBeGreaterThan(224);});

it('climb/release and sideways stepping cannot ratchet free ladders upward into air',()=>{
 let s=ticks(createState(level()),180).state;s=ticks(s,300,{climbY:-1}).state;const top=Math.min(...s.ladders.map(c=>c.y));expect(top).toBe(6);
 for(let i=0;i<50;i++){s=ticks(s,1).state;s=ticks(s,2,{climbY:-1}).state;}
 for(let i=0;i<4;i++){s=ticks(s,22,{moveX:i%2?1:-1}).state;s=ticks(s,220,{climbY:-1}).state;}
 expect(Math.min(...s.ladders.map(c=>c.y))).toBe(top);expect(s.player.position.y).toBeGreaterThanOrEqual(top*32);
});

it('upward excavation completes the traversed upper-bank anchor while respecting the flight ceiling',()=>{
 const l=level(),tiles=l.tiles.map((t,i)=>Math.floor(i/w)===4?{kind:'bedrock' as const}:i%w===3&&Math.floor(i/w)===7?{kind:'soil' as const}:t);
 tiles[4*w+3]={kind:'soil'};let s=createState({...l,spawn:{x:80,y:128},tiles});
 // Existing lower chamber and rung were reached by a prior valid fall in this level.
 s={...s,player:{...s.player,position:{x:112,y:218}},ladders:[{x:3,y:6}]};
 const opened=s.tiles.map((t,i)=>i===5*w+3?{kind:'soil' as const,maxIntegrity:2,currentIntegrity:2}:t);
 s=ticks({...s,tiles:opened},240,{climbY:-1}).state;
 expect(s.ladders).toContainEqual({x:3,y:3});expect(s.ladders).not.toContainEqual({x:3,y:2});expect(s.player.position.y).toBe(96);
});
