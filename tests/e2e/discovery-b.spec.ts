import {test,expect,type Page} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
import {build} from 'vite';
import {resolve} from 'node:path';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {DEPOSIT_NUGGETS,depositTier} from '../../src/core/deposits';
import type {GameState} from '../../src/core/model';
test.setTimeout(120000);
type Snapshot=Omit<GameState,'level'|'tiles'>;
async function state(page:Page):Promise<Snapshot>{return JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}') as Snapshot;}
async function render(page:Page){return JSON.parse(await page.locator('canvas').getAttribute('data-render')??'{}') as {terrain:{nuggets:number;fog:number;hints:number;rebuilds:number;instances:number};drawCalls:number;triangles:number;renderMs:number;tileWidth:number;tileHeight:number;moleWidth:number;moleHeight:number};}
const visible=(s:Snapshot,i:number)=>!!((s.discovered[i>>>5]??0)&1<<(i&31));
async function advance(page:Page,n=1){await page.clock.runFor(n*1000/60+1);}
async function until(page:Page,p:(s:Snapshot)=>boolean){for(let i=0;i<900;i++){await advance(page);if(p(await state(page)))return;}throw new Error('Discovery route stuck '+JSON.stringify((await state(page)).player));}
async function oreCount(page:Page){const s=await state(page),expected=firstBurrow.tiles.reduce((n,t,i)=>n+(t.kind==='ore_soil'&&visible(s,i)&&!s.collectedLootIds.includes(t.lootId??'')?DEPOSIT_NUGGETS[depositTier(t.lootValue??0)]:0),0);expect((await render(page)).terrain.nuggets).toBe(expected);}
for(const [mode,width,height] of [['keyboard',1920,1080],['mouse',844,390],['touch',390,844]] as const)test('B real exploration, hidden pocket, persistent fog and resize via '+mode,async({page,context},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height});await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await page.goto('/');await until(page,s=>s.player.grounded);
 const cdp=await context.newCDPSession(page);
 const hold=async(action:'left'|'right'|'up'|'down')=>{
  if(mode==='keyboard'){await page.keyboard.down({left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown'}[action]);return;}
  const b=await page.getByRole('button',{name:{left:'Move left',right:'Move right',up:'Climb up',down:'Climb down or drop'}[action],exact:true}).boundingBox();if(!b)throw new Error('Missing direction');const p={x:b.x+b.width/2,y:b.y+b.height/2};
  if(mode==='mouse'){await page.mouse.move(p.x,p.y);await page.mouse.down();}else await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});
 };
 const release=async(action:'left'|'right'|'up'|'down')=>{if(mode==='keyboard')await page.keyboard.up({left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown'}[action]);else if(mode==='mouse')await page.mouse.up();else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const initial=await state(page);expect(visible(initial,103)).toBe(false);expect((await render(page)).terrain.nuggets).toBe(2);await oreCount(page);await page.screenshot({path:info.outputPath('B-initial-'+mode+'.png')});
 await hold('right');await until(page,s=>s.player.position.x>=175);await release('right');await until(page,s=>s.player.position.y===288);
 await hold('up');await until(page,s=>s.player.position.y<=191);await release('up');await advance(page);
 expect(visible(await state(page),103)).toBe(false);expect((await render(page)).terrain.hints).toBe(4);await oreCount(page);await page.screenshot({path:info.outputPath('B-clues-'+mode+'.png')});
 await hold('down');await until(page,s=>s.player.position.y>=220);await release('down');await advance(page);
 await hold('right');await until(page,s=>visible(s,103));await release('right');await advance(page);await oreCount(page);
 const revealed=await state(page),ladders=revealed.ladders;expect(revealed.player.climbing).toBe(true);await page.screenshot({path:info.outputPath('B-revealed-'+mode+'.png')});
 await hold('right');await until(page,s=>s.collectedLootIds.includes('first-burrow-7-6'));await release('right');await advance(page);
 const collected=await state(page);expect(collected.levelGoldCollected).toBe(32);expect(collected.wallet).toBe(32);expect(collected.ladders).toEqual(ladders);expect(collected.collectedLootIds.filter(id=>id==='first-burrow-7-6')).toHaveLength(1);await oreCount(page);
 await hold('left');await until(page,s=>Math.abs(s.player.position.x-176)<2);await release('left');await hold('up');await until(page,s=>s.player.position.y<=128.01);await release('up');await advance(page);
 const returned=await state(page);for(let i=0;i<432;i++)if(visible(collected,i))expect(visible(returned,i)).toBe(true);
 const paused=await render(page);await page.setViewportSize({width:width===390?844:390,height:width===390?390:844});await advance(page,10);
 expect((await state(page)).discovered).toEqual(returned.discovered);expect((await render(page)).terrain.rebuilds).toBe(paused.terrain.rebuilds);await oreCount(page);
 await page.setViewportSize({width,height});await advance(page,10);await page.screenshot({path:info.outputPath('B-return-'+mode+'.png')});
 const m=await render(page);expect(m.tileWidth).toBe(m.tileHeight);expect(m.moleWidth).toBeLessThanOrEqual(20);expect(m.moleHeight).toBeLessThanOrEqual(26);
 writeFileSync(info.outputPath('B-explored-metrics.json'),JSON.stringify({mode,width,height,metrics:m,discovered:returned.discovered},null,2));
 await page.getByRole('button',{name:'Restart',exact:true}).click();await until(page,s=>s.player.grounded);expect((await state(page)).discovered).toEqual(initial.discovered);expect((await state(page)).wallet).toBe(0);expect(visible(await state(page),103)).toBe(false);await oreCount(page);expect(errors).toEqual([]);
});

test('B profiling: empty-page scheduling versus idle and exploring production game',async({page},info)=>{
 const sample=async()=>page.evaluate(async()=>new Promise<number[]>(resolve=>{const times:number[]=[];let previous=performance.now();const frame=(now:number)=>{times.push(now-previous);previous=now;if(times.length===120)resolve(times.slice(1).sort((a,b)=>a-b));else requestAnimationFrame(frame);};requestAnimationFrame(frame);}));
 await page.setViewportSize({width:390,height:844});await page.goto('about:blank');const empty=await sample();await page.goto('/');await expect(page.locator('canvas')).toHaveAttribute('data-render',/Three.js/);await page.waitForTimeout(1500);
 const before=await render(page),idle=await sample(),after=await render(page);expect(after.terrain.rebuilds).toBe(before.terrain.rebuilds);
 await page.keyboard.down('ArrowRight');await expect.poll(async()=>(await state(page)).wallet).toBeGreaterThan(0);await page.keyboard.up('ArrowRight');const explored=await render(page),moving=await sample();
 const receipt={empty:{median:empty[59],p95:empty[113]},idle:{median:idle[59],p95:idle[113],metrics:after},explored:{median:moving[59],p95:moving[113],metrics:explored},lastTerrainSyncMs:await page.locator('canvas').getAttribute('data-terrain-ms')};
 writeFileSync(info.outputPath('B-profile.json'),JSON.stringify(receipt,null,2));
});

test('B worst-case fully discovered terrain profile without Phaser, simulation or HUD updates',async({page},info)=>{
 const bundle=await build({configFile:false,logLevel:'silent',build:{write:false,minify:true,lib:{entry:resolve('tests/fixtures/b-profile.ts'),formats:['es']},rollupOptions:{output:{inlineDynamicImports:true}}}});
 let code='';for(const result of Array.isArray(bundle)?bundle:[bundle])if('output' in result)for(const item of result.output)if(item.type==='chunk')code=item.code;
 if(!code)throw new Error('Missing profile bundle');
 const html=readFileSync('dist/index.html','utf8').replace(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/,'<script type="module" src="/__b-profile.js"></script>');
 await page.route('**/__b-profile.js',r=>r.fulfill({contentType:'text/javascript',body:code}));await page.route('**/__b-profile.html',r=>r.fulfill({contentType:'text/html',body:html}));
 const receipts=[];
 for(const [width,height] of [[390,844],[844,390],[1920,1080]] as const){
  await page.setViewportSize({width,height});await page.goto('/__b-profile.html');await expect(page.locator('canvas')).toHaveAttribute('data-render',/Three.js/);await page.waitForTimeout(1500);
  const before=await render(page);expect(before.terrain.fog).toBe(0);expect(before.terrain.nuggets).toBe(20);
  const intervals=await page.evaluate(async()=>new Promise<number[]>(resolve=>{const times:number[]=[];let old=performance.now();const frame=(now:number)=>{times.push(now-old);old=now;if(times.length===120)resolve(times.slice(1).sort((a,b)=>a-b));else requestAnimationFrame(frame);};requestAnimationFrame(frame);}));
  const m=await render(page);expect(m.terrain.rebuilds).toBe(before.terrain.rebuilds);expect(m.tileWidth).toBe(m.tileHeight);
  receipts.push({width,height,median:intervals[59],p95:intervals[113],metrics:m});await page.screenshot({path:info.outputPath('B-fully-discovered-'+width+'x'+height+'.png')});
 }
 writeFileSync(info.outputPath('B-fully-discovered-profile.json'),JSON.stringify(receipts,null,2));
});
