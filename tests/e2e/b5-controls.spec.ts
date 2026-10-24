import {test,expect,type Page} from '@playwright/test';
import type {GameState} from '../../src/core/model';
test.setTimeout(45000);
async function state(p:Page):Promise<GameState>{return JSON.parse(await p.locator('canvas').getAttribute('data-state')??'{}') as GameState;}
async function advance(p:Page,n=1){await p.clock.runFor(1000/60*n+1);}
async function until(p:Page,condition:(s:GameState)=>boolean){for(let i=0;i<400;i++){await advance(p);if(condition(await state(p)))return;}throw new Error('B.5 input route stuck');}
for(const [mode,width,height] of [['keyboard',1920,1080],['mouse',844,390],['touch',390,844]] as const)test('B.5 deliberate single cells, mining release and smooth pose via '+mode,async({page,context},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.setViewportSize({width,height});await page.clock.install({time:new Date('2026-10-24T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-24T00:00:01Z'));await page.goto('/');await until(page,s=>s.player.grounded);
 const cdp=await context.newCDPSession(page);const label={left:'Move left',right:'Move right'};
 const hold=async(direction:'left'|'right')=>{if(mode==='keyboard'){await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',code:direction==='left'?'KeyA':'KeyD',key:direction==='left'?'ф':'в'});return;}const b=await page.getByRole('button',{name:label[direction],exact:true}).boundingBox();if(!b)throw new Error('Missing button');const p={x:b.x+b.width/2,y:b.y+b.height/2};if(mode==='mouse'){await page.mouse.move(p.x,p.y);await page.mouse.down();}else await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});};
 const release=async(direction:'left'|'right')=>{if(mode==='keyboard')await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',code:direction==='left'?'KeyA':'KeyD',key:'changed-layout'});else if(mode==='mouse')await page.mouse.up();else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const pose=async()=>JSON.parse(await page.locator('canvas').getAttribute('data-render')??'{}') as {moleCenter:{x:number;y:number};moleWidth:number;moleHeight:number;tileWidth:number;tileHeight:number};
 await page.screenshot({path:info.outputPath('B5-initial-'+mode+'.png')});
 await hold('left');await advance(page);await release('left');expect((await state(page)).player.position).toEqual({x:48,y:128});const moving=await pose();expect(moving.moleCenter.x).toBeGreaterThan(48);expect(moving.moleCenter.x).toBeLessThanOrEqual(80);
 await advance(page,20);expect((await state(page)).player.position).toEqual({x:48,y:128});expect((await pose()).moleCenter.x).toBe(48);await advance(page,30);expect((await state(page)).player.position.x).toBe(48);
 await hold('right');await until(page,s=>s.wallet===10);await release('right');const mined=await state(page);expect(mined.player.position).toEqual({x:80,y:128});expect(mined.collectedLootIds).toEqual(['first-burrow-3-3']);await advance(page,20);expect((await state(page)).player.position).toEqual(mined.player.position);
 await hold('right');await advance(page);await release('right');expect((await state(page)).player.position).toEqual({x:112,y:128});await advance(page,20);expect((await state(page)).player.position.x).toBe(112);
 await page.screenshot({path:info.outputPath('B5-one-cell-after-mining-'+mode+'.png')});
 const m=await pose();expect(m.tileWidth).toBe(m.tileHeight);expect(m.moleWidth).toBeLessThanOrEqual(20);expect(m.moleHeight).toBeLessThanOrEqual(26);
 const buttons=await page.locator('button[data-action]').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));for(const b of buttons){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y+b.h).toBeLessThanOrEqual(height);expect(b.x+b.w).toBeLessThanOrEqual(width);}
 expect(errors).toEqual([]);
});
