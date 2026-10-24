import {expect,it} from 'vitest';
import {createState,validateLevel} from '../../src/core/levels';
import {discover,isDiscovered} from '../../src/core/discovery';
import {depositTier,goldHintAt,DEPOSIT_NUGGETS} from '../../src/core/deposits';
import {IDLE,type GameState,type InputIntent,type Tile} from '../../src/core/model';
import {stepGame} from '../../src/core/simulation';
import {adventureLevels,firstBurrow} from '../../src/content/levels/first-burrow';
import {GameController} from '../../src/app/GameController';
import {DT} from '../../src/core/constants';
import {TerrainView} from '../../src/presentation/three/TerrainView';
import {ObjectsView} from '../../src/presentation/three/ObjectsView';
import {Resources} from '../../src/presentation/three/geometry';
import {InstancedMesh,Matrix4,Vector3} from 'three';
import {revealAll} from '../fixtures/discovery';
function fixture():GameState {
 const w=9,h=9,tiles:Tile[]=Array.from({length:w*h},(_,i)=>({kind:i%w===0||i%w===8||Math.floor(i/w)===8?'bedrock':'soil'}));
 tiles[31]={kind:'empty'};tiles[34]={kind:'ore_soil',lootId:'buried-rich',lootValue:40};
 const s=createState({id:'b-test',name:'B test',depth:0,width:w,height:h,tiles,spawn:{x:144,y:128},killY:288,startWallet:0,treasureQuota:40,overlays:[],boulders:[],goldHints:[{cell:{x:5,y:3},depositId:'buried-rich'}]});
 return {...s,ladders:[{x:4,y:3}],player:{...s.player,climbing:true}};
}
function tick(s:GameState,input:Partial<InputIntent>={}){return stepGame(s,{...IDLE,...input});}
function run(s:GameState,n:number,input:Partial<InputIntent>={}){for(let i=0;i<n;i++)s=tick(s,input).state;return s;}
it('initial discovery is small, unsigned packed, bounded and solid terrain stops propagation',()=>{
 const s=fixture();expect(s.discovered).toHaveLength(3);expect(s.discovered[0]).toBeGreaterThanOrEqual(2**31);
 expect(isDiscovered(s,31)).toBe(true);expect(isDiscovered(s,32)).toBe(true);expect(isDiscovered(s,33)).toBe(false);expect(isDiscovered(s,34)).toBe(false);
 expect(Array.from({length:81},(_,i)=>isDiscovered(s,i)).filter(Boolean)).toHaveLength(5);
 for(const i of [-1,81,1.5])expect(isDiscovered(s,i)).toBe(false);
 expect(discover(s).discovered).toBe(s.discovered);
});
it('open-cell reveal follows a two-step cardinal boundary rather than seeing through solids or around remote corners',()=>{
 const s=fixture(),tiles=s.tiles.slice();tiles[32]={kind:'empty'};tiles[33]={kind:'empty'};const seen=discover({...s,tiles});
 expect(isDiscovered(seen,33)).toBe(true);expect(isDiscovered(seen,34)).toBe(false); // three steps away
 expect(isDiscovered(seen,41)).toBe(true);expect(isDiscovered(seen,42)).toBe(false);
});
it('horizontal excavation reveals its new boundary, then the real hidden vein without duplicate rewards',()=>{
 let s=fixture(),dug=false;
 for(let i=0;i<70;i++){const r=tick(s,{moveX:1});s=r.state;if(r.events.some(e=>e.type==='TileDug')){dug=true;break;}}
 expect(dug).toBe(true);expect(isDiscovered(s,33)).toBe(true);expect(isDiscovered(s,34)).toBe(false);expect(s.player.position.y).toBe(128);expect(s.player.climbing).toBe(true);
 s=run(s,230,{moveX:1});expect(isDiscovered(s,34)).toBe(true);expect(s.tiles[34]?.kind).toBe('empty');expect(s.wallet).toBe(40);expect(s.collectedLootIds).toEqual(['buried-rich']);
 const after=run(s,400,{moveX:1});expect(after.wallet).toBe(40);expect(after.tiles[34]?.kind).toBe('empty');expect(after.ladders).toEqual([{x:4,y:3}]);
});
it('downward mining exposes one solid boundary and generates only actual lower-row rungs',()=>{
 let s=fixture();for(let i=0;i<60;i++){const r=tick(s,{climbY:1});s=r.state;if(r.events.some(e=>e.type==='TileDug'))break;}
 expect(s.tiles[40]?.kind).toBe('empty');expect(isDiscovered(s,49)).toBe(true);expect(isDiscovered(s,58)).toBe(false);
 s=run(s,8,{climbY:1});expect(s.ladders.every(l=>l.x===4)).toBe(true);expect(s.ladderProcessedCells.every(l=>l.x===4)).toBe(true);
});
it('re-entry never removes fog history and idle reuses the same packed array',()=>{
 const s=fixture(),far=discover({...s,player:{...s.player,position:{x:208,y:224}}}),back=discover({...far,player:s.player});
 for(let i=0;i<81;i++)if(isDiscovered(far,i))expect(isDiscovered(back,i)).toBe(true);
 expect(run(s,60).discovered).toBe(s.discovered);expect(discover(back).discovered).toBe(back.discovered);
});
it('attempt state round trips through JSON and continues deterministically without browser APIs',()=>{
 const s=run(fixture(),15,{moveX:1}),restored=JSON.parse(JSON.stringify(s)) as GameState;
 expect(run(restored,180,{moveX:1})).toEqual(run(s,180,{moveX:1}));
 expect(s.discovered.every(Number.isSafeInteger)).toBe(true);
});
it('restart discards attempt discoveries and reconstructs entry visibility and economy',()=>{
 const c=new GameController(firstBurrow),initial=c.state;c.queue({moveX:1,climbY:0});for(let i=0;i<70;i++)c.advance(DT);
 expect(c.state.discovered).not.toEqual(initial.discovered);c.restart();expect(c.state).toEqual(initial);
});
it('all four deposit sizes derive from finite authored value and have distinct silhouettes',()=>{
 expect([8,14,24,40].map(depositTier)).toEqual(['small','medium','rich','rare']);expect(new Set(Object.values(DEPOSIT_NUGGETS)).size).toBe(4);
 expect(new Set(adventureLevels.flatMap(l=>l.tiles.filter(t=>t.kind==='ore_soil').map(t=>depositTier(t.lootValue??0)))).size).toBe(4);
});
it('hints reference real nearby hidden deposits and disappear when the source becomes discovered',()=>{
 const s=fixture();expect(goldHintAt(s,32)).toBe(true);expect(goldHintAt(s,30)).toBe(false);expect(goldHintAt(revealAll(s),32)).toBe(false);
 for(const l of adventureLevels)expect(validateLevel(l)).toBe(l);
 for(const hints of [[{cell:{x:5,y:3},depositId:'missing'}],[{cell:{x:1,y:1},depositId:'buried-rich'}],[{cell:{x:4,y:3},depositId:'buried-rich'}]])expect(()=>validateLevel({...s.level,goldHints:hints})).toThrow('Invalid gold hint');
});
it('damage regeneration does not hide discoveries, and Up cannot damage a ceiling',()=>{
 const s=fixture(),hit=run(s,5,{moveX:1}),rest=run(hit,181);expect(rest.tiles[32]?.currentIntegrity).toBe(2);expect(rest.discovered).toEqual(hit.discovered);
 expect(run(s,100,{climbY:-1}).tiles).toEqual(s.tiles);expect(run(s,100,{climbY:-1}).ladders).toEqual(s.ladders);
});
it('different display callback rates produce identical authoritative discovery and mining',()=>{
 const states=[1,2,4].map(factor=>{const c=new GameController(firstBurrow);c.queue({moveX:1,climbY:0});for(let i=0;i<240/factor;i++)c.advance(DT*factor);return c.state;});expect(states[1]).toEqual(states[0]);expect(states[2]).toEqual(states[0]);
});
it('hidden ore has no submitted nuggets or soil instances; excavation reveals the complete soil base',()=>{
 const r=new Resources(),v=new TerrainView(r),s=fixture(),before=JSON.stringify(s);v.sync(s);
 expect(v.counts.nuggets).toBe(0);expect(v.counts.fog).toBe(76);expect(v.counts.hints).toBe(2);
 const visible=revealAll(s);v.sync(visible);expect(v.counts.nuggets).toBe(7);expect(v.counts.fog).toBe(0);
 const bases=v.root.children.filter(c=>c.name==='solid-gold-bearing-soil') as InstancedMesh[];expect(bases.reduce((n,b)=>n+b.count,0)).toBe(1);
 expect(JSON.stringify(s)).toBe(before);v.dispose();r.dispose();
});
it('fog uses complete square cells at the approved front plane and never covers occupied cells',()=>{
 const r=new Resources(),v=new TerrainView(r),s=fixture();v.sync(s);const fogs=v.root.children.filter(c=>c.name==='undiscovered-cells') as InstancedMesh[];
 for(const fog of fogs)for(let i=0;i<fog.count;i++){const m=new Matrix4(),p=new Vector3(),scale=new Vector3();fog.getMatrixAt(i,m);p.setFromMatrixPosition(m);scale.setFromMatrixScale(m);expect(scale.x).toBe(32);expect(scale.y).toBe(32);expect(p.z).toBe(0);expect(isDiscovered(s,Math.floor(-p.y/32)*9+Math.floor(p.x/32))).toBe(false);}
 v.dispose();r.dispose();
});
it('a body spanning four empty cells and its immediate collision hazard remain visible',()=>{
 const base=fixture(),tiles=base.tiles.slice();for(const i of [31,32,40,41,42])tiles[i]={kind:'empty'};
 const s=discover({...base,tiles,player:{...base.player,position:{x:159.5,y:132}},boulders:[{id:'near',position:{x:192,y:128},falling:false,warningTicks:0,velocityY:0}]});
 for(const i of [31,32,40,41,42])expect(isDiscovered(s,i)).toBe(true);
 const r=new Resources(),v=new ObjectsView(r);v.sync(s,s,1);expect((v.root.getObjectByName('falling-boulders') as InstancedMesh).count).toBe(1);v.dispose();r.dispose();
});
it('idle, camera-independent draws and equivalent state cause zero rebuilds; one changed chunk rebuilds once',()=>{
 const r=new Resources(),v=new TerrainView(r),s=fixture();v.sync(s);const n=v.counts.rebuilds;
 v.sync({...s,tick:2});v.sync({...s,discovered:s.discovered.slice(),tiles:s.tiles.slice()});expect(v.counts.rebuilds).toBe(n);
 v.sync({...s,tiles:s.tiles.map((t,i)=>i===32?{...t,currentIntegrity:1}:t)});expect(v.counts.rebuilds).toBe(n+1);
 v.dispose();r.dispose();
});
function drive(s:GameState,input:Partial<InputIntent>,reached:(s:GameState)=>boolean):GameState {
 for(let i=0;i<4000;i++){if(reached(s))return s;s=tick(s,input).state;if(s.status!=='playing')throw new Error('Optional route ended unexpectedly');}throw new Error('Optional route stuck '+JSON.stringify(s.player));
}
for(const side of [-1,1] as const)it(`First Burrow ${side} optional fork is accessible and returns to the surface at all powers`,()=>{
 for(const power of [1,2,3]){
  let s=createState(firstBurrow,0,power);s=drive(s,{moveX:1},s=>s.player.position.x>=175);s=drive(s,{},s=>s.player.position.y===288);
  s=drive(s,{climbY:-1},s=>s.player.position.y<=224);s=tick(s).state;const ladders=s.ladders;
  const id=side<0?'first-burrow-3-6':'first-burrow-7-6';s=drive(s,{moveX:side},s=>s.collectedLootIds.includes(id));
  expect(s.ladders).toEqual(ladders);expect(s.levelGoldCollected).toBe(side<0?24:32);
  s=drive(s,{moveX:-side as -1|1},s=>Math.abs(s.player.position.x-176)<2);s=drive(s,{climbY:-1},s=>s.player.position.y<=128.01);
  expect(s.player.alive).toBe(true);expect(s.player.position.y).toBeCloseTo(128,5);
 }
});
for(const [index,x,y] of [[1,10,10],[2,7,12]] as const)it(`level ${index} valuable detour is accessible, returnable and benefits from upgrades`,()=>{
 const costs:number[]=[];
 for(const power of [1,2,3]){
  const level=adventureLevels[index];let s=createState(level,0,power);const approach=index===1?176:368;
  s=drive(s,{moveX:1},s=>s.player.position.x>=approach-1);s=drive(s,{climbY:1},s=>s.player.position.y>=288&&s.player.grounded);
  const target=x*32+16,sign=target<s.player.position.x?-1:1;s=drive(s,{moveX:sign},s=>Math.abs(s.player.position.x-target)<2);const start=s.tick,id=level.id+'-'+x+'-'+y;
  s=drive(s,{climbY:1},s=>s.collectedLootIds.includes(id));costs.push(s.tick-start);expect(isDiscovered(s,y*16+x)).toBe(true);
  s=drive(s,{climbY:-1},s=>s.player.position.y<=288.01);expect(s.player.alive).toBe(true);
 }
 expect(costs[2]).toBeLessThan(costs[0]??0);
});
