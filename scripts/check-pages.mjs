import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const url=process.argv[2]??'https://mytriv.github.io/shiny-burrows/';
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const [mode,width,height] of [['keyboard',1920,1080],['mouse',844,390],['touch',390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.clock.install({time:new Date('2026-10-24T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-24T00:00:01Z'));
  const response=await page.goto(url,{waitUntil:'load'});assert.equal(response?.status(),200);
  const state=async()=>JSON.parse(await page.locator('canvas').getAttribute('data-state')??'{}');
  const advance=async(n=1)=>page.clock.runFor(n*1000/60+1);
  const until=async(predicate)=>{for(let i=0;i<400;i++){await advance();if(predicate(await state()))return;}throw new Error(mode+': published game did not reach target');};
  await until(s=>s.player?.grounded);const cdp=await context.newCDPSession(page);
  const hold=async(direction)=>{
   if(mode==='keyboard'){await page.keyboard.down(direction==='left'?'ArrowLeft':'ArrowRight');return;}
   const box=await page.getByRole('button',{name:direction==='left'?'Move left':'Move right',exact:true}).boundingBox();assert.ok(box);
   const point={x:box.x+box.width/2,y:box.y+box.height/2};
   if(mode==='mouse'){await page.mouse.move(point.x,point.y);await page.mouse.down();}else await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...point}]});
  };
  const release=async(direction)=>{if(mode==='keyboard')await page.keyboard.up(direction==='left'?'ArrowLeft':'ArrowRight');else if(mode==='mouse')await page.mouse.up();else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  await hold('left');await advance();await release('left');await advance(30);assert.deepEqual((await state()).player.position,{x:48,y:128});
  await hold('right');await until(s=>s.wallet===10);await release('right');await advance(20);assert.deepEqual((await state()).player.position,{x:80,y:128});
  await hold('right');await advance();await release('right');await advance(20);assert.deepEqual((await state()).player.position,{x:112,y:128});
  assert.deepEqual(errors,[]);results.push({mode,viewport:`${width}x${height}`,http:response.status(),wallet:(await state()).wallet,result:'passed'});await context.close();
 }
 console.log(JSON.stringify({url,checks:results},null,2));
} finally {await browser.close();}
