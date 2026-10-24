// QA compositor: only arranges actual browser screenshots and labels their recorded simulation ticks.
// Uses an existing Sharp installation supplied explicitly; not an application dependency.
import {createRequire} from 'node:module';
import {readdirSync,readFileSync,mkdirSync} from 'node:fs';
import {join,basename,dirname} from 'node:path';
const [sharpPath,input,output]=process.argv.slice(2);
if(!sharpPath||!input||!output)throw new Error('Usage: node scripts/v5-contact-sheets.mjs <existing-sharp-module> <test-results> <output-directory>');
const sharp=createRequire(import.meta.url)(sharpPath);mkdirSync(output,{recursive:true});
const files=readdirSync(input,{recursive:true}).map(p=>String(p));
for(const label of ['walk-left','walk-right','dig-left','dig-right','dig-up','dig-down']){
 const frames=files.filter(p=>new RegExp('^'+label+'-\\d+\\.png$').test(basename(p))).sort((a,b)=>Number(basename(a).match(/-(\d+)\.png$/)?.[1])-Number(basename(b).match(/-(\d+)\.png$/)?.[1]));
 if(!frames.length)throw new Error('No captured frames for '+label);
 const samples=JSON.parse(readFileSync(join(input,dirname(frames[0]),label+'-poses.json'),'utf8'));
 const columns=label.startsWith('walk')?6:5,rows=Math.ceil(frames.length/columns),width=columns*240,height=rows*292+50;
 const layers=[{input:Buffer.from(`<svg width="${width}" height="50"><rect width="100%" height="100%" fill="#281a26"/><text x="20" y="32" font-family="sans-serif" font-size="22" fill="#ffe1a3">${label}: ${frames.length} actual rendered frames (50 ms browser-clock steps)</text></svg>`),left:0,top:0}];
 for(let i=0;i<frames.length;i++){
  const left=i%columns*240,top=50+Math.floor(i/columns)*292,sample=samples[i];
  layers.push({input:await sharp(join(input,frames[i])).resize(240,256).png().toBuffer(),left,top});
  layers.push({input:Buffer.from(`<svg width="240" height="36"><text x="8" y="23" font-family="sans-serif" font-size="13" fill="#ffe1a3">${i+1} · t${sample?.tick}${label.startsWith('dig')?' · hit +'+sample?.pose?.strikeAge:''}</text></svg>`),left,top:top+256});
 }
 await sharp({create:{width,height,channels:4,background:'#20151e'}}).composite(layers).png().toFile(join(output,label+'-sheet.png'));
}
