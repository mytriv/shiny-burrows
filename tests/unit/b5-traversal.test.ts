import {expect,it} from 'vitest';
import {createState} from '../../src/core/levels';
import {stepGame} from '../../src/core/simulation';
import {IDLE,type GameState,type InputIntent} from '../../src/core/model';
import {sandbox} from '../fixtures/sandbox';
import {WALK_TICKS,FALL_TICKS,playerCell} from '../../src/core/traversal';
import {playerPose} from '../../src/app/playerPose';
import {GameController} from '../../src/app/GameController';
import {DT} from '../../src/core/constants';
import {adventureLevels} from '../../src/content/levels/first-burrow';
import {solve} from '../levels/v3-routes';
import {TerrainView} from '../../src/presentation/three/TerrainView';
import {Resources} from '../../src/presentation/three/geometry';
import {InstancedMesh} from 'three';
function tick(s:GameState,input:Partial<InputIntent>={}){return stepGame(s,{...IDLE,...input}).state;}
function run(s:GameState,n:number,input:Partial<InputIntent>={}){for(let i=0;i<n;i++)s=tick(s,input);return s;}
it('one press commits exactly one adjacent cell and release never queues another',()=>{
 const s=createState(sandbox),one=tick(s,{moveX:1});expect(one.player.position).toEqual({x:112,y:160});expect(run(one,100).player.position).toEqual(one.player.position);
 expect(one.traversal).toEqual({from:s.player.position,startedTick:0,ticks:12,kind:'walk'});
});
it('held movement repeats only at readable cell boundaries',()=>{
 const s=createState(sandbox);expect(run(s,12,{moveX:1}).player.position.x).toBe(112);expect(run(s,13,{moveX:1}).player.position.x).toBe(144);expect(run(s,25,{moveX:1}).player.position.x).toBe(176);
});
it('a reversal during a committed step does not queue overshoot after release',()=>{
 const s=run(tick(createState(sandbox),{moveX:1}),5,{moveX:-1});expect(s.player.position.x).toBe(112);expect(run(s,80).player.position.x).toBe(112);
 expect(run(s,8,{moveX:-1}).player.position.x).toBe(80);
});
it('spawn and authoritative player positions reject arbitrary half cells',()=>{
 for(const spawn of [{x:81,y:160},{x:80,y:159}])expect(()=>createState({...sandbox,spawn})).toThrow('grid');
 const s=createState(sandbox);expect(()=>tick({...s,player:{...s.player,position:{x:85,y:160}}})).toThrow('grid');
});
it('presentation eases within one committed segment without changing Core occupancy',()=>{
 const s=tick(createState(sandbox),{moveX:1}),before=JSON.stringify(s),samples=Array.from({length:13},(_,i)=>playerPose({...s,tick:i+1},0));
 expect(samples[0]).toEqual({x:80,y:160});expect(samples[12]).toEqual({x:112,y:160});for(let i=1;i<samples.length;i++)expect(samples[i]?.x).toBeGreaterThanOrEqual(samples[i-1]?.x??0);expect(JSON.stringify(s)).toBe(before);
});
it('leaving support takes one horizontal cell then resolves vertical falls without air steering',()=>{
 let s=createState({...sandbox,spawn:{x:240,y:160}});s=tick(s,{moveX:1});expect(s.player.position).toEqual({x:272,y:160});expect(s.player.grounded).toBe(false);
 s=run(s,WALK_TICKS,{moveX:1});expect(s.player.position).toEqual({x:272,y:192});s=run(s,FALL_TICKS,{moveX:-1});expect(s.player.position).toEqual({x:272,y:224});
});
it('explicit platform drop is buffered once until the current step finishes',()=>{
 let s:GameState={...createState({...sandbox,spawn:{x:240,y:160}}),platforms:[{x:8,y:5},{x:8,y:7}]};s=tick(s,{moveX:1});s=tick(s,{climbY:1,downPressed:true});expect(s.traversal?.dropRequested).toBe(true);
 s=run(s,100,{climbY:1});expect(s.player.position.y).toBe(224);expect(s.player.grounded).toBe(true);expect(s.platforms).toHaveLength(2);
});
it('logical occupancy remains obvious during deterministic mixed input at all display rates',()=>{
 const play=(factor:number)=>{const c=new GameController(adventureLevels[0]);for(let i=0;i<480/factor;i++){c.queue({moveX:1,climbY:0});c.advance(DT*factor);expect(c.state.player.position.x%32).toBe(16);expect(c.state.player.position.y%32).toBe(0);}return c.state;};expect(play(1)).toEqual(play(2));expect(play(1)).toEqual(play(4));
});
it('all three base campaign routes have stable new grid-step timing and unchanged rewards',()=>{
 const ticks=[1191,1349,2035],gold=[30,71,122];for(let i=0;i<3;i++){const level=adventureLevels[i];if(!level)throw new Error('Missing mine');const s=solve(createState(level),i);expect(s.tick).toBe(ticks[i]);expect(s.wallet).toBe(gold[i]);expect(playerCell(s).x).toBeGreaterThan(0);}
});
it('soft fog is presentation-only and updates neighboring chunk edges without per-frame rebuilding',()=>{
 const r=new Resources(),v=new TerrainView(r),s=createState(adventureLevels[0]),before=JSON.stringify(s);v.sync(s);
 const edges=v.root.children.filter(c=>c.name==='feathered-discovery-boundary') as InstancedMesh[];expect(edges.reduce((n,e)=>n+e.count,0)).toBeGreaterThan(0);expect(r.fogEdge().transparent).toBe(true);expect(r.fogEdge().depthWrite).toBe(false);
 const n=v.counts.rebuilds;v.sync({...s,tick:80});expect(v.counts.rebuilds).toBe(n);expect(JSON.stringify(s)).toBe(before);v.dispose();r.dispose();
});
it('Up cannot bridge a missing rung in a disconnected shaft',()=>{
 const initial=createState(sandbox),tiles=initial.tiles.map(()=>({kind:'empty' as const}));
 const s={...initial,tiles,ladders:[{x:2,y:1},{x:2,y:4}],player:{...initial.player,climbing:true}};
 expect(tick(s,{climbY:-1}).player.position).toEqual(s.player.position);
});
it('pause clears an uncommitted buffered drop while preserving its committed cell',()=>{
 const c=new GameController({...sandbox,spawn:{x:240,y:160}});c.state={...c.state,platforms:[{x:8,y:5}]};c.queue({...IDLE,moveX:1});c.advance(DT);c.queue({...IDLE,downPressed:true,climbY:1});c.advance(DT);expect(c.state.traversal?.dropRequested).toBe(true);
 c.pause(true);expect(c.state.traversal?.dropRequested).toBe(false);c.pause(false);c.advance(DT*5);c.advance(DT*5);c.advance(DT*5);expect(c.state.player.position).toEqual({x:272,y:160});
});
