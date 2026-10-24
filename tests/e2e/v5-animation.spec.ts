import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import type {GameState} from '../../src/core/model';
test.setTimeout(60000);
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const items:string[]=[];errors.set(page,items);page.on('pageerror',e=>items.push(e.message));page.on('console',e=>{if(e.type()==='error')items.push(e.text());});});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function state(page:Page):Promise<GameState>{return JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}') as GameState;}
async function until(page:Page,predicate:()=>Promise<boolean>,limit=600){for(let i=0;i<limit;i++){await page.clock.runFor(17);if(await predicate())return;}throw new Error('Clock-stepped gameplay route did not reach its target');}
async function boot(page:Page,manual=false){
 await page.setViewportSize({width:844,height:390});
 if(manual){await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));}else await page.clock.install();
 await page.goto('/');
 if(manual)await until(page,async()=>(await state(page)).player?.grounded===true);else await expect.poll(async()=>(await state(page)).player?.grounded).toBe(true);
}
async function walk(page:Page,x:number){const key=(await state(page)).player.position.x<x?'d':'a';await page.keyboard.down(key);await until(page,async()=>key==='d'?(await state(page)).player.position.x>=x:(await state(page)).player.position.x<=x);await page.keyboard.up(key);}
async function chamber(page:Page){await boot(page,true);await walk(page,175);await until(page,async()=>(await state(page)).player.position.y===288);await walk(page,399);}
type Pose={animation:string;tick:number;pose:{arms:number[];legs:number[];bodyY:number;strikeAge:number}};
async function capture(page:Page,info:TestInfo,label:string,n:number):Promise<Pose[]>{
 const samples:Pose[]=[];
 for(let i=0;i<n;i++){
  const canvas=page.locator('canvas'),box=await canvas.boundingBox();if(!box)throw new Error('Canvas');
  const render=JSON.parse(await canvas.getAttribute('data-render')??'{}') as {visualPosition:{x:number;y:number}},view=JSON.parse(await canvas.getAttribute('data-view')??'{}') as {x:number;y:number;zoom:number};
  const sx=box.x+(render.visualPosition.x-view.x)*view.zoom,sy=box.y+(render.visualPosition.y-view.y)*view.zoom;
  const pose=JSON.parse(await canvas.getAttribute('data-pose')??'{}') as Pose['pose'];const s=await state(page);samples.push({animation:await canvas.getAttribute('data-animation')??'',tick:s.tick,pose});
  if(i===0)await page.screenshot({path:info.outputPath(label+'-context.png')});
  await page.screenshot({path:info.outputPath(label+'-'+i+'.png'),clip:{x:Math.max(0,Math.min(724,sx-60)),y:Math.max(0,Math.min(262,sy-64)),width:120,height:128}});
  await page.clock.runFor(50);
 }
 writeFileSync(info.outputPath(label+'-poses.json'),JSON.stringify(samples,null,2));return samples;
}
test('VA-04 six rendered walking samples each direction',async({page},info)=>{
 await chamber(page);await page.clock.runFor(300);
 for(const [key,name] of [['a','walk-left'],['d','walk-right']] as const){await page.keyboard.down(key);for(let i=0;i<30;i++){await page.clock.runFor(17);if(await page.locator('canvas').getAttribute('data-animation')==='walk')break;}const samples=await capture(page,info,name,6);await page.keyboard.up(key);expect(samples.every(p=>p.animation==='walk')).toBe(true);expect(new Set(samples.map(p=>JSON.stringify(p.pose.legs))).size).toBe(6);expect(new Set(samples.map(p=>p.pose.bodyY)).size).toBeGreaterThan(4);}
});
for(const direction of ['left','right','down'] as const)test('VA-05 complete rendered claw sequence '+direction,async({page},info)=>{
 await chamber(page);
 if(direction==='left'||direction==='right'){await page.keyboard.down('s');await until(page,async()=>(await state(page)).player.position.y>=320);await page.keyboard.up('s');}
 const key={left:'a',right:'d',up:'w',down:'s'}[direction];await page.keyboard.down(key);
 for(let i=0;i<30;i++){await page.clock.runFor(17);if(await page.locator('canvas').getAttribute('data-animation')==='dig-'+direction)break;}
 const samples=await capture(page,info,'dig-'+direction,10);await page.keyboard.up(key);const digging=samples.filter(p=>p.animation==='dig-'+direction);expect(digging.length).toBeGreaterThanOrEqual(6);expect(new Set(digging.map(p=>JSON.stringify(p.pose.arms))).size).toBeGreaterThanOrEqual(4);
});
test('settings pauses, exposes real controls and resumes without held input',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Settings and help'}).click();await expect(page.getByRole('dialog')).toBeVisible();const tick=(await state(page)).tick;await page.keyboard.press('d');await page.waitForTimeout(200);expect((await state(page)).tick).toBe(tick);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect.poll(async()=>(await state(page)).tick).toBeGreaterThan(tick);expect((await state(page)).player.position.x).toBe(80);
});

