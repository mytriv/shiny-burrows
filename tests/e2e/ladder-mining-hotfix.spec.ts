import {test,expect,type Page,type CDPSession} from '@playwright/test';
import type {GameState,InputIntent} from '../../src/core/model';
test.setTimeout(120000);
async function state(page:Page):Promise<GameState>{return JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}') as GameState;}
async function advance(page:Page,count=1){await page.clock.runFor(count*1000/60+1);}
async function until(page:Page,predicate:(s:GameState)=>boolean|Promise<boolean>){for(let i=0;i<700;i++){await advance(page);const s=await state(page);if(s.player&&await predicate(s))return;}throw new Error('Hotfix route did not reach target');}
class Directions {
 private fingers=new Map<number,{id:number;x:number;y:number}>();
 constructor(private page:Page,private mode:'keyboard'|'mouse'|'touch',private cdp:CDPSession){}
 async down(action:'left'|'right'|'up',id=1){
  if(this.mode==='keyboard'){await this.page.keyboard.down({left:'a',right:'d',up:'w'}[action]);return;}
  const box=await this.page.getByRole('button',{name:{left:'Move left',right:'Move right',up:'Climb up'}[action],exact:true}).boundingBox();if(!box)throw new Error('Direction button missing');
  const p={id,x:box.x+box.width/2,y:box.y+box.height/2};
  if(this.mode==='mouse'){await this.page.mouse.move(p.x,p.y);await this.page.mouse.down();}
  else {this.fingers.set(id,p);await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...this.fingers.values()]});}
 }
 async up(action:'left'|'right'|'up',id=1){
  if(this.mode==='keyboard'){await this.page.keyboard.up({left:'a',right:'d',up:'w'}[action]);return;}
  if(this.mode==='mouse')await this.page.mouse.up();else {const point=this.fingers.get(id);this.fingers.delete(id);await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:point?[point]:[]});}
 }
}
for(const [mode,width,height] of [['keyboard',1920,1080],['mouse',844,390],['touch',390,844]] as const)test('hotfix: suspended left/right mining and release through '+mode,async({page,context},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.setViewportSize({width,height});await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
 const cdp=await context.newCDPSession(page);
 for(const direction of ['left','right'] as const){
  await page.goto('/');await until(page,s=>s.player.grounded);
  const d=new Directions(page,mode,cdp);await d.down('right');await until(page,s=>s.player.position.x>=175);await d.up('right');await until(page,s=>s.player.position.y===288);
  await d.down('up');await until(page,s=>s.player.position.y<=192);await d.up('up');await advance(page);
  const before=await state(page);expect(before.player.climbing).toBe(true);expect(before.player.position.y).toBe(192);
  if(mode==='touch')await d.down('up',1);
  await d.down(direction,mode==='touch'?2:1);await until(page,s=>s.miningContact?.direction===direction&&s.nextDigTick>before.nextDigTick);
  const hit=await state(page);expect(hit.player.position.y).toBe(before.player.position.y);expect(hit.player.climbing).toBe(true);expect(hit.player.velocity.y).toBe(0);
  const cell=hit.miningContact?.cell;if(!cell)throw new Error('Missing actual mining contact');const target=cell.y*16+cell.x;
  const damage=async()=>JSON.parse(await page.locator('canvas').getAttribute('data-damage')??'[]') as {index:number;current:number}[];
  expect((await damage()).find(d=>d.index===target)?.current).toBe(1);
  if(mode==='touch'){
   const held=JSON.parse(await page.locator('canvas').getAttribute('data-input')??'{}') as InputIntent;expect(held.climbY).toBe(-1);expect(held.moveX).toBe(direction==='left'?-1:1);
   await d.up('up',1);await advance(page);
   const selective=JSON.parse(await page.locator('canvas').getAttribute('data-input')??'{}') as InputIntent;expect(selective.climbY).toBe(0);expect(selective.moveX).toBe(direction==='left'?-1:1);
  }
  await d.up(direction,mode==='touch'?2:1);await advance(page,10);const idle=await state(page);expect(idle.player.position).toEqual(hit.player.position);expect(idle.player.climbing).toBe(true);
  await d.down(direction);await until(page,async()=>!(await damage()).some(d=>d.index===target));await d.up(direction);const broken=await state(page);
  expect(broken.tick-hit.tick).toBeLessThan(60);expect(broken.player.position.y).toBe(before.player.position.y);expect(broken.player.climbing).toBe(true);expect(broken.ladders).toEqual(before.ladders);expect(broken.ladderProcessedCells).toEqual(before.ladderProcessedCells);
  await advance(page,30);expect((await state(page)).player.position).toEqual(broken.player.position);
  await page.screenshot({path:info.outputPath('suspended-'+direction+'-'+mode+'.png')});
  await d.down(direction);await until(page,s=>!s.player.climbing);await d.up(direction);const detached=await state(page);
  expect(detached.player.position.y).toBe(before.player.position.y);expect(detached.player.grounded).toBe(true);expect(Math.abs(detached.player.position.x-before.player.position.x)).toBe(32);expect(detached.ladders).toEqual(before.ladders);expect(detached.ladderProcessedCells).toEqual(before.ladderProcessedCells);
 }
 expect(errors).toEqual([]);
});
