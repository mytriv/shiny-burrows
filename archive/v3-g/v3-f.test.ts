import { describe,expect,it } from 'vitest';
import { BALANCE } from '../../src/core/config';
import { DT } from '../../src/core/constants';
import { createState } from '../../src/core/levels';
import { IDLE,type GameState,type InputIntent,type TileKind,type GameEvent } from '../../src/core/model';
import { stepGame } from '../../src/core/simulation';
import { GameController } from '../../src/app/GameController';
import { sandbox } from '../fixtures/sandbox';
import { ticks } from '../fixtures/ticks';
const index=4*22+3;
function fixture(kind:TileKind='soil',power=1):GameState {
 const level={...sandbox,spawn:{x:86,y:160},tiles:sandbox.tiles.map((t,i)=>i===index?{kind}:t)};
 return ticks(createState(level,0,power),1);
}
function run(initial:GameState,n:number,input:Partial<InputIntent>={moveX:1}) {
 let state=initial;const events:GameEvent[]=[];const hitTicks:number[]=[];
 for(let i=0;i<n;i++){const r=stepGame(state,{...IDLE,...input});if(r.events.some(e=>e.type==='TileHit'))hitTicks.push(state.tick);state=r.state;events.push(...r.events);}
 return {state,events,hitTicks};
}
describe('V3-F automatic digging and correction window',()=>{
 it('contact hits immediately, stops walking, waits 24 ticks, then resumes through consecutive soil',()=>{
  const initial=fixture();const r=run(initial,BALANCE.digTicks+1);
  expect(r.hitTicks).toEqual([initial.tick,initial.tick+BALANCE.digTicks]);expect(r.state.tiles[index]?.kind).toBe('empty');expect(r.state.player.position.x).toBe(86);
  expect(ticks(r.state,1,{moveX:1}).player.position.x).toBeCloseTo(87.6);expect(r.state.ladders).toEqual([]);
  const two={...initial,tiles:initial.tiles.map((t,i)=>i===index+1?{...initial.tiles[index] ?? {kind:'soil' as const,maxIntegrity:2,currentIntegrity:2}}:t)};
  const chain=run(two,100);expect(chain.events.filter(e=>e.type==='TileDug')).toHaveLength(2);expect(chain.hitTicks).toHaveLength(4);
 });
 it('short accidental press cannot remove soil at any upgrade tier',()=>{for(const power of [1,2,3,99]){const first=run(fixture('soil',power),1);expect(first.state.tiles[index]?.currentIntegrity).toBe(1);const stopped=run(first.state,24,{moveX:0});expect(stopped.state.tiles[index]?.kind).toBe('soil');expect(stopped.hitTicks).toEqual([]);}});
 it('standard soil always takes exactly two distinct ticks, harder strata keep configured hits',()=>{
  for(const [kind,max] of [['soil',2],['compacted',3],['gravel',3],['hard',5],['fragile',3]] as const)for(const power of [1,2,3]){
   const r=run(fixture(kind,power),200);expect(r.events.filter(e=>e.type==='TileHit')).toHaveLength(Math.max(2,Math.ceil(max/power)));expect(new Set(r.hitTicks).size).toBe(r.hitTicks.length);expect(r.state.tiles[index]?.kind).toBe('empty');
  }
 });
 it('release clears pending contact, preserves damage and reengagement waits a new interval',()=>{
  let s=run(fixture(),10).state;s=ticks(s,1);expect(s.miningContact).toBe(null);expect(s.tiles[index]?.currentIntegrity).toBe(1);
  const resumed=run(s,24);expect(resumed.hitTicks).toEqual([]);expect(run(resumed.state,1).state.tiles[index]?.kind).toBe('empty');
 });
 it('changing direction cancels old sequence and does not reset partial damage',()=>{
  let s=run(fixture(),12).state;s=ticks(s,10,{moveX:-1});expect(s.miningContact).toBe(null);expect(s.player.position.x).toBeLessThan(86);expect(s.tiles[index]?.currentIntegrity).toBe(1);
  const back=run(s,20);expect(back.hitTicks).toEqual([]);expect(back.state.tiles[index]?.kind).toBe('soil');
 });
 it('repeated one-tick taps cannot bypass the hold interval',()=>{let s=fixture();for(let i=0;i<50;i++){s=ticks(s,1,{moveX:1});s=ticks(s,1);}expect(s.tiles[index]?.kind).toBe('soil');});
 it('partial damage heals at 180 idle ticks and minimum protection is restored',()=>{
  let s=run(fixture('soil',3),1).state;const last=s.tiles[index]?.lastHitTick??-1;s=ticks(s,179);expect(s.tiles[index]?.currentIntegrity).toBe(1);expect(s.tick).toBe(last+180);s=ticks(s,1);expect(s.tiles[index]?.currentIntegrity).toBe(2);expect(run(s,1).state.tiles[index]?.kind).toBe('soil');
 });
 it('does not mine before contact, through bedrock, while moving away or beyond nearest cell',()=>{
  let s=fixture();s={...s,player:{...s.player,position:{x:80,y:160}}};expect(run(s,3).hitTicks).toEqual([]);expect(run(fixture('bedrock'),100).events.filter(e=>e.type==='TileHit')).toEqual([]);
  expect(run(fixture(),100,{moveX:-1}).hitTicks).toEqual([]);expect(run(fixture(),100,{moveX:0,digHeld:true}).hitTicks).toEqual([]);
  const barrier={...fixture('bedrock'),tiles:fixture('bedrock').tiles.map((t,i)=>i===index+1?{kind:'soil' as const,maxIntegrity:2,currentIntegrity:2}:t)};expect(run(barrier,100).state.tiles[index+1]?.currentIntegrity).toBe(2);
 });
 it('solid wall gives a distinct single contact event and consumes no mining ticks or money',()=>{const start=fixture('bedrock'),r=run(start,100);expect(r.events.filter(e=>e.type==='SolidBlocked')).toHaveLength(1);expect(r.state.wallet).toBe(start.wallet);expect(r.state.nextDigTick).toBe(start.nextDigTick);});
 it('Down plus movement without Dig only mines horizontally, never floor or ladders/platforms',()=>{const initial=fixture(),r=run(initial,80,{moveX:1,climbY:1});expect(r.state.tiles[index]?.kind).toBe('empty');expect(r.state.ladders).toEqual([]);expect(r.state.platforms).toEqual([]);expect(r.state.tiles[5*22+3]).toEqual(initial.tiles[5*22+3]);});
 it('Down alone cannot excavate; explicit Down+Dig still creates ladders and allows return',()=>{const level={...sandbox,tiles:sandbox.tiles.map((t,i)=>i===5*22+2?{kind:'soil' as const}:t)};let s=ticks(createState(level),1);expect(ticks(s,90,{climbY:1}).ladders).toEqual([]);s=ticks(s,90,{climbY:1,digHeld:true});expect(s.ladders.length).toBeGreaterThanOrEqual(2);expect(s.player.position.y).toBeGreaterThan(160);expect(ticks(s,180,{climbY:-1}).player.position.y).toBe(154);});
 it('30/60/120 Hz and changing display cadence produce identical state and hit ticks',()=>{
  const render=(frames:readonly number[])=>{const c=new GameController({...sandbox,spawn:{x:86,y:160},tiles:sandbox.tiles.map((t,i)=>i===index?{kind:'hard'}:t)});const hits:number[]=[];for(const delta of frames){c.queue({...IDLE,moveX:1});const events=c.advance(delta);hits.push(...events.filter(e=>e.type==='TileHit').map(()=>c.state.nextDigTick-BALANCE.digTicks));}return {state:c.state,hits};};
  const a=render(Array(120).fill(DT) as number[]);expect(render(Array(60).fill(DT*2) as number[])).toEqual(a);expect(render(Array(240).fill(DT/2) as number[])).toEqual(a);
  const changing=Array.from({length:40},()=>[DT/2,DT/2,DT*2]).flat();expect(render(changing)).toEqual(a);
 });
 it('controller release, pause and capped catchup never schedule an extra hit',()=>{const c=new GameController({...sandbox,spawn:{x:86,y:160},tiles:sandbox.tiles.map((t,i)=>i===index?{kind:'soil'}:t)});c.queue({...IDLE,moveX:1});expect(c.advance(DT*5).filter(e=>e.type==='TileHit')).toHaveLength(1);c.queue(IDLE);expect(c.advance(DT*5).filter(e=>e.type==='TileHit')).toEqual([]);c.pause(true);expect(c.state.miningContact).toBe(null);c.advance(10);c.pause(false);expect(c.advance(DT*5).filter(e=>e.type==='TileHit')).toEqual([]);});
});
