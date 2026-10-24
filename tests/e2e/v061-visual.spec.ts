import {test,expect} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
let fixtureCode='';
test.beforeAll(async()=>{
 const result=await build({configFile:false,logLevel:'silent',build:{write:false,minify:true,lib:{entry:resolve('tests/fixtures/v061-visual.ts'),formats:['es']},rollupOptions:{output:{inlineDynamicImports:true}}}});
 const results=Array.isArray(result)?result:[result];
 for(const output of results)if('output' in output)for(const chunk of output.output)if(chunk.type==='chunk')fixtureCode=chunk.code;
 if(!fixtureCode)throw new Error('Fixture bundling failed');
});
test('v0.6.1 embedded soil and round boulder warning, falling, impact and rest',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:800,height:700});
 await page.route('**/__v061.js',route=>route.fulfill({contentType:'text/javascript',body:fixtureCode}));
 await page.route('**/__v061.html',route=>route.fulfill({contentType:'text/html',body:'<style>body{margin:0;background:#281317;color:white}#game{position:relative;width:800px;height:640px}canvas{width:100%;height:100%}button{height:44px;min-width:100px}</style><div id="game"></div><button id="warning">Warning</button><button id="falling">Falling</button><button id="impact">Impact</button><button id="rest">Rest</button><script type="module" src="/__v061.js"></script>'}));
 await page.goto('/__v061.html');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-rock',/qa-round-rock/);
 const rock=async()=>JSON.parse(await canvas.getAttribute('data-rock')??'{}') as {falling:boolean;warningTicks:number;velocityY:number;position:{x:number;y:number}};
 for(const name of ['warning','falling','impact','rest']){await page.locator('#'+name).click();const r=await rock();if(name==='warning')expect(r.warningTicks).toBeGreaterThan(0);if(name==='falling'){expect(r.falling).toBe(true);expect(r.velocityY).toBeGreaterThan(120);}if(name==='impact'||name==='rest'){expect(r.falling).toBe(false);expect(r.position.y).toBe(192);}await page.screenshot({path:info.outputPath('v061-boulder-'+name+'.png')});}
 const m=JSON.parse(await canvas.getAttribute('data-render')??'{}') as {tileWidth:number;tileHeight:number;moleWidth:number;moleHeight:number};expect(m.tileWidth).toBe(m.tileHeight);expect(m.moleWidth).toBeLessThanOrEqual(20);expect(m.moleHeight).toBeLessThanOrEqual(26);expect(errors).toEqual([]);
});
