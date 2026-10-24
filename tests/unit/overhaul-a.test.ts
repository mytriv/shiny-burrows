import {expect,it} from 'vitest';
import {createState} from '../../src/core/levels';
import {traceLadders} from '../../src/core/ladders';
import {contactDig,dig} from '../../src/core/mining';
import {IDLE,type GameState} from '../../src/core/model';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {stepGame} from '../../src/core/simulation';
const empty=()=>createState({...firstBurrow,goldHints:[],treasureQuota:0,overlays:[],tiles:firstBurrow.tiles.map(()=>({kind:'empty'}))});
it('Up never excavates even through the direct Core digging API',()=>{
 const initial=createState(firstBurrow);const cell=3*16+3;
 const s={...initial,player:{...initial.player,position:{x:112,y:160}}};
 for(const action of [dig,contactDig]){const r=action(s,{...IDLE,climbY:-1});expect(r.events).toEqual([]);expect(r.state.tiles[cell]).toEqual(s.tiles[cell]);expect(r.state.wallet).toBe(0);}
});
it('horizontal ladder exits and same-row falling never backfill a neighboring cell',()=>{
 const s={...empty(),ladders:[{x:2,y:4}]};
 for(const path of [[{x:80,y:160},{x:112,y:150}], [{x:80,y:150},{x:112,y:150},{x:112,y:151}], [{x:80,y:150},{x:80,y:149}], [{x:80,y:150},{x:80,y:150}]]){
  expect(traceLadders(s,path).state.ladders).toEqual(s.ladders);
 }
});
it('downward row crossings create only entered cells, once, including long falls',()=>{
 let s=empty();const path=[{x:112,y:128},{x:112,y:240}];const r=traceLadders(s,path);s=r.state;
 expect(s.ladders).toEqual([4,5,6,7].map(y=>({x:3,y})));
 expect(r.events).toHaveLength(4);expect(traceLadders(s,path).events).toEqual([]);
 const removed:GameState={...s,ladders:[]};expect(traceLadders(removed,path).events).toEqual([]);
 expect(traceLadders(s,[{x:112,y:240},{x:112,y:96}]).events).toEqual([]);
});
it('collision paths and diagonal junctions authorize downward rows, never lateral entries',()=>{
 const s=empty(),r=traceLadders(s,[{x:80,y:160},{x:112,y:159},{x:112,y:161},{x:144,y:161},{x:144,y:161},{x:144,y:162}]);
 expect(r.state.ladders).toEqual([{x:3,y:5}]);
 expect(traceLadders(r.state,[{x:144,y:162},{x:144,y:160},{x:112,y:160},{x:112,y:161}]).events).toEqual([]);
});
it('blocked transitions are processed once and cannot become rungs on a repeated collision path',()=>{
 const base=empty(),s={...base,platforms:[{x:3,y:4}]},path=[{x:112,y:128},{x:112,y:129}];
 const r=traceLadders(s,path);expect(r.state.ladders).toEqual([]);
 expect(traceLadders({...r.state,platforms:[]},path).events).toEqual([]);
});
it('actual lateral detachment during climbing does not turn gravity microsteps into extra rungs',()=>{
 const base=empty(),s={...base,ladders:[{x:2,y:4}],player:{...base.player,position:{x:80,y:160},climbing:true}};
 const r=stepGame(s,{...IDLE,moveX:1,climbY:-1});
 expect(r.state.player.climbing).toBe(false);expect(r.state.player.position.x).toBe(112);
 expect(r.state.player.position.y).toBe(160);expect(r.state.ladders).toEqual(s.ladders);expect(r.state.ladderProcessedCells).toEqual([]);
});
it('landing and repeated grounded collision resolution do not enter the solid floor cell',()=>{
 const base=empty(),tiles=base.tiles.map((t,i)=>Math.floor(i/16)===5?{kind:'bedrock' as const}:t);
 let s:GameState={...base,tiles,player:{...base.player,position:{x:112,y:160},velocity:{x:0,y:120}}};
 for(let i=0;i<60;i++)s=stepGame(s,IDLE).state;
 expect(s.player.position.y).toBe(160);expect(s.player.grounded).toBe(true);expect(s.ladders).toEqual([]);expect(s.ladderProcessedCells).toEqual([]);
});
it('diagonal falls past a ladder junction process each crossed row once without upward creation',()=>{
 const base=empty();let s:GameState={...base,ladders:[{x:2,y:4}],player:{...base.player,position:{x:80,y:160},velocity:{x:0,y:200}}};
 const additions:string[]=[];
 for(let i=0;i<50;i++){const r=stepGame(s,{...IDLE,moveX:i<20?1:-1,climbY:i%2?-1:0});s=r.state;for(const e of r.events)if(e.type==='LadderAdded')additions.push(e.cell.x+','+e.cell.y);}
 expect(new Set(additions).size).toBe(additions.length);expect(additions.length).toBeGreaterThan(0);
 expect(s.ladders.every(c=>c.y>=4)).toBe(true);
});
it('Up on an existing ladder holds grip at a solid ceiling without damaging terrain or adding rungs',()=>{
 const base=empty();let s:GameState={...base,tiles:base.tiles.map((t,i)=>i===3*16+3?{kind:'soil',maxIntegrity:2,currentIntegrity:2}:t),ladders:[{x:3,y:4}],player:{...base.player,position:{x:112,y:160},climbing:true}};
 const tiles=s.tiles;
 for(let i=0;i<240;i++)s=stepGame(s,{...IDLE,climbY:-1}).state;
 expect(s.tiles).toEqual(tiles);expect(s.ladders).toEqual([{x:3,y:4}]);expect(s.ladderProcessedCells).toEqual([]);expect(s.wallet).toBe(0);
 const p=s.player.position;for(let i=0;i<60;i++)s=stepGame(s,IDLE).state;expect(s.player.position).toEqual(p);
});
it('First Burrow natural shaft returns to the original bank without upward excavation or added anchors',()=>{
 let s=createState(firstBurrow);
 for(let i=0;i<300&&s.player.position.x<175;i++)s=stepGame(s,{...IDLE,moveX:1}).state;
 for(let i=0;i<180;i++)s=stepGame(s,IDLE).state;
 expect(s.player.position.y).toBe(288);const ladders=s.ladders;
 for(let i=0;i<240;i++)s=stepGame(s,{...IDLE,climbY:-1}).state;
 expect(s.player.position.y).toBe(128);expect(s.ladders).toEqual(ladders);
 for(let i=0;i<20;i++)s=stepGame(s,{...IDLE,moveX:-1}).state;
 expect(s.player.position.y).toBe(128);expect(s.player.grounded).toBe(true);
});
it('shaft-top foothold supports dismount only: Down bypasses it and falls already below it continue',()=>{
 const base=empty(),s:GameState={...base,ladders:[{x:3,y:4},{x:3,y:5}],player:{...base.player,position:{x:112,y:128}}};
 const idle=stepGame(s,IDLE).state;expect(idle.player.position.y).toBe(128);expect(idle.player.grounded).toBe(true);
 const down=stepGame(s,{...IDLE,climbY:1,downPressed:true}).state;expect(down.player.position.y).toBeGreaterThan(128);
 const below=stepGame({...s,player:{...s.player,position:{x:112,y:160}}},IDLE).state;expect(below.player.position.y).toBeGreaterThan(160);
 const up=stepGame({...s,player:{...s.player,climbing:true}},{...IDLE,climbY:-1}).state;expect(up.player.position.y).toBe(128);expect(up.ladders).toEqual(s.ladders);
});
it('existing platforms connect the top of a return ladder without creating occupied rungs',()=>{
 const base=empty();let s:GameState={...base,ladders:[{x:3,y:5},{x:3,y:6}],platforms:[{x:3,y:4}],player:{...base.player,position:{x:112,y:224}}};
 for(let i=0;i<120;i++)s=stepGame(s,{...IDLE,climbY:-1}).state;
 expect(s.player.position.y).toBe(128);expect(s.ladders).toEqual([{x:3,y:5},{x:3,y:6}]);expect(s.ladderProcessedCells).toEqual([]);
});
