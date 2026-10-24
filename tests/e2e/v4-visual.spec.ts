import {test,expect,type Page} from '@playwright/test';
import {writeFileSync} from 'node:fs';
type Metrics={engine:string;projection:string;cameraRotation:number[];tileWidth:number;tileHeight:number;moleWidth:number;moleHeight:number;drawCalls:number;triangles:number;geometries:number;textures:number;renderMs:number;frameMs:number;particles:number;pixelRatio:number;terrain:{tiles:number;nuggets:number;cracks:number}};
async function metrics(page:Page):Promise<Metrics>{return JSON.parse(await page.locator('#game canvas').getAttribute('data-render')??'{}') as Metrics;}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const items:string[]=[];errors.set(page,items);page.on('pageerror',e=>items.push(e.message));page.on('console',e=>{if(e.type()==='error')items.push(e.text());});page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4187/'))items.push(r.url());});});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
for(const [width,height] of [[390,844],[844,390],[1920,1080]])test('v0.4 square world, bounded mole and rendering budget '+width+'x'+height,async({page},info)=>{
 await page.setViewportSize({width:width??390,height:height??844});await page.goto('/');await expect(page.locator('canvas')).toHaveCount(1);
 await expect.poll(async()=>(await metrics(page)).terrain?.tiles).toBeGreaterThan(0);await page.waitForTimeout(1500);
 const m=await metrics(page);expect(m.engine).toBe('Three.js r180');expect(m.projection).toBe('orthographic');expect(m.cameraRotation[0]).toBeCloseTo(-Math.PI/9,6);expect(m.cameraRotation.slice(1)).toEqual([0,0]);expect(m.tileWidth).toBe(m.tileHeight);expect(m.moleWidth).toBeLessThanOrEqual(20);expect(m.moleHeight).toBeLessThanOrEqual(26);expect(m.pixelRatio).toBeLessThanOrEqual(1.5);expect(m.drawCalls).toBeLessThan(90);expect(m.triangles).toBeLessThan(150000);expect(m.renderMs).toBeLessThan(35);
 const intervals=await page.evaluate(async()=>new Promise<number[]>(resolve=>{const samples:number[]=[];let before=performance.now();const sample=(now:number)=>{samples.push(now-before);before=now;if(samples.length===120)resolve(samples.slice(1));else requestAnimationFrame(sample);};requestAnimationFrame(sample);}));
 intervals.sort((a,b)=>a-b);const timing={medianMs:intervals[59],p95Ms:intervals[113]};
 const device=await page.locator('canvas').evaluate(canvas=>{const gl=(canvas as HTMLCanvasElement).getContext('webgl2');const debug=gl?.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,gpu:debug?gl?.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unavailable'};});
 // Preserve measurements even when the acceptance assertion fails.
 const budgetPath=info.outputPath('rendering-budget.json');writeFileSync(budgetPath,JSON.stringify({...m,timing,device},null,2));await info.attach('rendering-budget',{path:budgetPath,contentType:'application/json'});
 await page.screenshot({path:info.outputPath('v4-surface-'+width+'x'+height+'.png')});
 expect(timing.medianMs).toBeLessThan(34);
 const buttons=await page.locator('button:visible').evaluateAll(items=>items.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));for(const b of buttons){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.x+b.w).toBeLessThanOrEqual(width??390);expect(b.y+b.h).toBeLessThanOrEqual(height??844);}
});
test('v0.4 damage heals visually and restart reuses GPU resources',async({page},info)=>{
 await page.goto('/');await expect.poll(async()=>(await metrics(page)).terrain?.cracks).toBe(0);
 await page.keyboard.down('d');await expect.poll(async()=>(await metrics(page)).terrain.cracks,{intervals:[10]}).toBeGreaterThan(0);await page.keyboard.up('d');
 await page.screenshot({path:info.outputPath('v4-claw-impact.png')});await expect.poll(async()=>(await metrics(page)).terrain.cracks,{timeout:6000}).toBe(0);await page.waitForTimeout(700);
 const before=await metrics(page);for(let i=0;i<8;i++){await page.keyboard.press('r');await page.waitForTimeout(60);}await page.waitForTimeout(200);
 const after=await metrics(page);expect(after.geometries).toBe(before.geometries);expect(after.textures).toBe(before.textures);expect(after.particles).toBe(0);expect({...after.terrain,rebuilds:0}).toEqual({...before.terrain,rebuilds:0});
 await page.getByRole('button',{name:'Mute sound'}).click();await expect(page.getByRole('button',{name:'Mute sound'})).toHaveAttribute('aria-pressed','true');
});
test('v0.4 reduced motion preserves input and bounded models',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect.poll(async()=>(await metrics(page)).terrain?.tiles).toBeGreaterThan(0);
 await page.keyboard.down('d');await expect.poll(async()=>(await metrics(page)).terrain.cracks).toBeGreaterThan(0);await page.keyboard.up('d');const m=await metrics(page);expect(m.particles).toBe(0);expect(m.moleWidth).toBeLessThanOrEqual(20);expect(m.moleHeight).toBeLessThanOrEqual(26);
});
