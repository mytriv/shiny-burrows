import {test,expect,type Page,type CDPSession} from '@playwright/test';
import type {GameState} from '../../src/core/model';
test.setTimeout(45000);
const failures=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];failures.set(page,errors);page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4187/'))errors.push(r.url());});});
test.afterEach(async({page})=>expect(failures.get(page)).toEqual([]));
async function state(page:Page):Promise<GameState>{return JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}') as GameState;}
async function boot(page:Page){await page.goto('/');await expect.poll(async()=>(await state(page)).player?.grounded).toBe(true);await expect(page.locator('[data-action=dig]')).toHaveCount(0);}
async function center(page:Page,name:string){const b=await page.getByRole('button',{name,exact:true}).boundingBox();if(!b)throw new Error(name);return {x:b.x+b.width/2,y:b.y+b.height/2};}
class DirectionDriver {
 private points=new Map<number,{id:number;x:number;y:number}>();
 constructor(private page:Page,private mode:'keyboard'|'mouse'|'touch',private cdp:CDPSession){}
 async down(name:'left'|'right'|'up'|'down'){
  const labels={left:'Move left',right:'Move right',up:'Climb up',down:'Climb down or drop'},keys={left:'a',right:'d',up:'w',down:'s'};
  if(this.mode==='keyboard'){await this.page.keyboard.down(keys[name]);return;}
  const p=await center(this.page,labels[name]);if(this.mode==='mouse'){await this.page.mouse.move(p.x,p.y);await this.page.mouse.down();}else{this.points.set(1,{id:1,...p});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...this.points.values()]});}
 }
 async up(name:'left'|'right'|'up'|'down'){
  if(this.mode==='keyboard'){await this.page.keyboard.up({left:'a',right:'d',up:'w',down:'s'}[name]);return;}
  if(this.mode==='mouse')await this.page.mouse.up();else{const p=this.points.get(1);this.points.clear();await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:p?[p]:[]});}
 }
 async walkTo(x:number){const left=(await state(this.page)).player.position.x>x;await this.down(left?'left':'right');await expect.poll(async()=>{const s=await state(this.page);return left?s.player.position.x<=x:s.player.position.x>=x;},{intervals:[10],timeout:10000}).toBe(true);await this.up(left?'left':'right');}
 async centerShaft(){for(let i=0;i<12;i++){const x=(await state(this.page)).player.position.x;if(x>=170&&x<=182)return;const dir=x>182?'left':'right';await this.down(dir);await this.page.waitForTimeout(20);await this.up(dir);}throw new Error('Could not center shaft');}
}
for(const [width,height,mode] of [[390,844,'touch'],[844,390,'mouse'],[1920,1080,'keyboard']] as const)test('natural multi-cell fall and return without restart '+width+'x'+height+' '+mode,async({page,context},info)=>{
 await page.setViewportSize({width,height});await boot(page);const d=new DirectionDriver(page,mode,await context.newCDPSession(page));await d.walkTo(175);await d.centerShaft();
 await expect.poll(async()=>(await state(page)).player.position.y,{timeout:10000}).toBe(288);const lower=await state(page);expect(lower.wallet).toBe(10);for(let y=4;y<=8;y++)expect(lower.ladders).toContainEqual({x:5,y});
 await page.screenshot({path:info.outputPath('g-fall-'+width+'x'+height+'.png')});
 await d.down('up');await expect.poll(async()=>(await state(page)).player.position.y,{intervals:[10]}).toBeLessThan(250);await d.up('up');
 await expect.poll(async()=>(await state(page)).player.velocity.y).toBe(0);const hanging=(await state(page)).player.position;
 await page.waitForTimeout(750);expect((await state(page)).player.position).toEqual(hanging);expect((await state(page)).player.climbing).toBe(true);
 await d.down('up');await expect.poll(async()=>(await state(page)).player.position.y,{timeout:10000}).toBe(128);await d.up('up');await d.walkTo(144);await expect.poll(async()=>(await state(page)).player.position.y).toBe(128);expect((await state(page)).wallet).toBe(10);
 const rects=await page.locator('button[data-action]').evaluateAll(items=>items.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));for(const r of rects){expect(r.w).toBeGreaterThanOrEqual(44);expect(r.h).toBeGreaterThanOrEqual(44);expect(r.y+r.h).toBeLessThanOrEqual(height);}
});
for(const [width,height,mode] of [[390,844,'touch'],[844,390,'mouse'],[1920,1080,'keyboard']] as const)test('Up is climb-only while standing without a ladder '+mode,async({page,context})=>{
 await page.setViewportSize({width,height});await boot(page);const d=new DirectionDriver(page,mode,await context.newCDPSession(page));
 await d.walkTo(175);await d.centerShaft();await expect.poll(async()=>(await state(page)).player.position.y).toBe(288);await d.walkTo(399);
 const before=await state(page);expect(before.player.climbing).toBe(false);expect(before.ladders.some(c=>c.x===12)).toBe(false);
 await expect(page.getByRole('button',{name:'Climb up',exact:true})).toBeEnabled();
 await d.down('up');await page.waitForTimeout(1500);await d.up('up');
 const after=await state(page);expect(after.player.position).toEqual(before.player.position);expect(after.player.climbing).toBe(false);expect(after.ladders).toEqual(before.ladders);expect(after.nextDigTick).toBe(before.nextDigTick);
 const damage=JSON.parse(await page.locator('canvas').getAttribute('data-damage')??'[]') as {index:number}[];expect(damage).toEqual([]);expect(await page.locator('canvas').getAttribute('data-animation')).not.toBe('dig-up');
});

test('A: leaving a ladder sideways in an open chamber never backfills the adjacent column',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await page.goto('/');
 const until=async(predicate:(s:GameState)=>boolean)=>{for(let i=0;i<900;i++){await page.clock.runFor(17);const s=await state(page);if(s.player&&predicate(s))return;}throw new Error('A route did not reach target');};
 await until(s=>s.player.grounded);await page.keyboard.down('d');await until(s=>s.player.position.x>=175);await page.keyboard.up('d');
 await until(s=>s.player.position.y===288);await page.keyboard.down('s');await until(s=>s.player.position.y===480);await page.keyboard.up('s');
 await page.keyboard.down('w');await until(s=>s.player.position.y<=456);await page.keyboard.up('w');
 await until(s=>!s.traversal);const before=await state(page);expect(before.player.climbing).toBe(true);
 await page.keyboard.down('d');await page.clock.runFor(17);await page.keyboard.up('d');const after=await state(page);
 expect(Math.floor(after.player.position.x/32)).toBeGreaterThan(Math.floor(before.player.position.x/32));
 expect(Math.floor((after.player.position.y-.0000001)/32)).toBe(Math.floor((before.player.position.y-.0000001)/32));
 expect(after.player.climbing).toBe(false);expect(after.ladders).toEqual(before.ladders);expect(after.ladderProcessedCells).toEqual(before.ladderProcessedCells);
 await page.screenshot({path:info.outputPath('a-sideways-ladder-exit-portrait.png')});
});
