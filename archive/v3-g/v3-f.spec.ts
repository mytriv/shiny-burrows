import {test,expect,type Page,type CDPSession} from '@playwright/test';
import type {GameState} from '../../src/core/model';
test.setTimeout(30000);
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const failures:string[]=[];errors.set(page,failures);page.on('pageerror',e=>failures.push(e.message));page.on('console',e=>{if(e.type()==='error')failures.push(e.text());});page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4187/'))failures.push('External '+r.url());});});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function state(page:Page):Promise<GameState&{paused:boolean}>{return JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}') as GameState&{paused:boolean};}
async function boot(page:Page){await page.goto('/');await expect.poll(async()=>(await state(page)).player?.grounded).toBe(true);}
async function damage(page:Page):Promise<readonly {index:number;current:number;max:number}[]>{return JSON.parse(await page.locator('canvas').getAttribute('data-damage')??'[]') as readonly {index:number;current:number;max:number}[];}
async function input(page:Page):Promise<{moveX:number;climbY:number;digHeld:boolean}>{return JSON.parse(await page.locator('canvas').getAttribute('data-input')??'{}') as {moveX:number;climbY:number;digHeld:boolean};}
async function physical(cdp:CDPSession,code:string,key:string,down=true,repeat=false){await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key,autoRepeat:repeat});}
async function center(page:Page,name:string){const b=await page.getByRole('button',{name,exact:true}).boundingBox();if(!b)throw new Error(name);return {x:b.x+b.width/2,y:b.y+b.height/2};}
class Touch{
 private points=new Map<number,{id:number;x:number;y:number}>();
 constructor(private cdp:CDPSession,private page:Page){}
 async down(id:number,name:string){this.points.set(id,{id,...await center(this.page,name)});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...this.points.values()]});}
 async up(id:number){const p=this.points.get(id);this.points.delete(id);await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:p?[p]:[]});}
 async cancel(){this.points.clear();await this.cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
}
test('alternate layout physical keys mine automatically; layout-changing keyup and tool repeats are safe',async({page,context})=>{
 await boot(page);const cdp=await context.newCDPSession(page);
 await physical(cdp,'KeyD','в');await expect.poll(async()=> (await damage(page)).some(t=>t.index===51),{intervals:[10]}).toBe(true);
 const first=await state(page);expect(first.player.position.x).toBe(86);expect(first.wallet).toBe(0);
 await physical(cdp,'KeyD','D',false);await page.waitForTimeout(500);expect((await state(page)).wallet).toBe(0);expect((await state(page)).player.position.x).toBe(86);
 await physical(cdp,'KeyD','В');await expect.poll(async()=>(await state(page)).wallet).toBe(10);await physical(cdp,'KeyD','в',false);
 await physical(cdp,'KeyB','и');await expect.poll(async()=>(await state(page)).inventory.platforms).toBe(1);
 for(let i=0;i<8;i++)await physical(cdp,'KeyB','И',true,true);
 await physical(cdp,'KeyB','b',false);expect((await state(page)).wallet).toBe(5);expect((await state(page)).inventory.platforms).toBe(1);
 await physical(cdp,'KeyD','в');await expect.poll(async()=>(await state(page)).player.position.x,{intervals:[16]}).toBeGreaterThanOrEqual(142);await physical(cdp,'KeyD','D',false);
 await physical(cdp,'KeyE','у');await physical(cdp,'KeyE','E',false);await expect.poll(async()=>(await state(page)).platforms.length).toBe(1);expect((await state(page)).inventory.platforms).toBe(0);
 await physical(cdp,'KeyR','к');await physical(cdp,'KeyR','R',false);await expect.poll(async()=>(await state(page)).tick).toBeLessThan(15);expect((await state(page)).wallet).toBe(0);
 await physical(cdp,'KeyS','ы');await physical(cdp,'KeyJ','о');await expect.poll(async()=>(await state(page)).ladders.length).toBeGreaterThanOrEqual(2);await physical(cdp,'KeyJ','J',false);await physical(cdp,'KeyS','S',false);
 await physical(cdp,'KeyW','ц');await expect.poll(async()=>(await state(page)).player.position.y,{timeout:10000}).toBe(122);await physical(cdp,'KeyW','W',false);
 await physical(cdp,'Escape','Escape');await physical(cdp,'Escape','Escape',false);await expect.poll(async()=>(await state(page)).paused).toBe(true);
});
test('all physical movement/dig codes and arrow scrolling use codes rather than characters',async({page,context})=>{
 await boot(page);const cdp=await context.newCDPSession(page);
 for(const [code,key,axis,value] of [['KeyA','ф','moveX',-1],['KeyD','в','moveX',1],['KeyW','ц','climbY',-1],['KeyS','ы','climbY',1],['ArrowLeft','ArrowLeft','moveX',-1],['ArrowRight','ArrowRight','moveX',1],['ArrowUp','ArrowUp','climbY',-1],['ArrowDown','ArrowDown','climbY',1]] as const){await physical(cdp,code,key);await expect.poll(async()=>(await input(page))[axis]).toBe(value);await physical(cdp,code,'changed-layout',false);await expect.poll(async()=>(await input(page))[axis]).toBe(0);}
 for(const [code,key] of [['KeyJ','о'],['KeyX','ч'],['Space',' ']] as const){await physical(cdp,code,key);await expect.poll(async()=>(await input(page)).digHeld).toBe(true);await physical(cdp,code,'changed-layout',false);await expect.poll(async()=>(await input(page)).digHeld).toBe(false);}
 expect(await page.evaluate(()=>window.scrollY)).toBe(0);
});
test('blur, visibility and pause clear holds; OS repeats cannot restart canceled movement',async({page,context})=>{
 await boot(page);const cdp=await context.newCDPSession(page);
 await physical(cdp,'KeyD','в');await expect.poll(async()=>(await damage(page)).length,{intervals:[10]}).toBe(1);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect.poll(async()=>(await state(page)).paused).toBe(true);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await physical(cdp,'KeyD','в',true,true);await page.waitForTimeout(500);expect((await state(page)).wallet).toBe(0);expect((await input(page)).moveX).toBe(0);
 await physical(cdp,'KeyD','D',false);await physical(cdp,'KeyD','в');await expect.poll(async()=>(await input(page)).moveX).toBe(1);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect.poll(async()=>(await input(page)).moveX).toBe(0);const x=(await state(page)).player.position.x;await page.waitForTimeout(500);expect((await state(page)).player.position.x).toBe(x);
 await physical(cdp,'KeyD','D',false);await physical(cdp,'KeyD','в');await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();expect((await input(page)).moveX).toBe(0);
});
for(const mode of ['mouse','touch'] as const)test(mode+' movement alone auto-digs; release/cancel preserves first-hit protection',async({page,context},info)=>{
 await page.setViewportSize(mode==='touch'?{width:390,height:844}:{width:1920,height:1080});await boot(page);const t=new Touch(await context.newCDPSession(page),page),p=await center(page,'Move right');
 const down=async()=>{if(mode==='touch')await t.down(1,'Move right');else{await page.mouse.move(p.x,p.y);await page.mouse.down();}};
 const up=async()=>{if(mode==='touch')await t.cancel();else await page.mouse.up();};
 await down();await expect.poll(async()=>(await damage(page)).length,{intervals:[10]}).toBe(1);await up();await page.waitForTimeout(500);expect((await state(page)).wallet).toBe(0);expect((await state(page)).ladders).toEqual([]);
 await page.screenshot({path:info.outputPath('v3-f-'+mode+'-first-hit.png')});
 await down();await expect.poll(async()=>(await state(page)).wallet).toBe(10);await expect.poll(async()=>(await state(page)).player.position.x,{intervals:[16]}).toBeGreaterThan(130);await up();expect((await state(page)).ladders).toEqual([]);
 await page.screenshot({path:info.outputPath('v3-f-'+mode+'.png')});await expect(page.getByRole('button',{name:'Dig ↓',exact:true})).toBeVisible();
});
test('touch auto-dig movement can coexist with a separate platform purchase pointer',async({page,context})=>{
 await page.setViewportSize({width:844,height:390});await boot(page);const t=new Touch(await context.newCDPSession(page),page);await t.down(1,'Move right');await expect.poll(async()=>(await state(page)).wallet).toBe(10);
 await t.down(2,'Buy ▰ 5');await t.up(2);await expect.poll(async()=>(await state(page)).inventory.platforms).toBe(1);expect((await input(page)).moveX).toBe(1);await t.cancel();await expect.poll(async()=>(await input(page)).moveX).toBe(0);
});

for(const every of [2,4])test('24-tick hits survive browser render callback interval x'+every,async({page})=>{
 // Test-only browser scheduling: keep the Core and all gameplay state untouched.
 await page.addInitScript((every:number)=>{
  const native=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);let serial=0;const pending=new Map<number,number>();
  window.requestAnimationFrame=(callback:FrameRequestCallback)=>{const id=++serial;let count=every;const frame=(time:number)=>{if(!pending.has(id))return;if(--count===0){pending.delete(id);callback(time);}else pending.set(id,native(frame));};pending.set(id,native(frame));return id;};
  window.cancelAnimationFrame=(id:number)=>{const actual=pending.get(id);if(actual!==undefined)cancel(actual);pending.delete(id);};
 },every);
 await boot(page);await page.keyboard.down('d');await expect.poll(async()=>(await damage(page)).length,{intervals:[10]}).toBe(1);const deadline=(await state(page)).nextDigTick;expect((await state(page)).wallet).toBe(0);
 await expect.poll(async()=>(await state(page)).wallet).toBe(10);const s=await state(page);await page.keyboard.up('d');expect(s.nextDigTick-deadline).toBe(24);expect(s.collectedLootIds).toEqual(['first-burrow-3-3']);
});
