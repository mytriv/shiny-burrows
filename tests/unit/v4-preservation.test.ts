import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { adventureLevels } from '../../src/content/levels/first-burrow';
import { createState } from '../../src/core/levels';
import { solve } from '../levels/v3-routes';
it('B.5 preserves unrelated Core modules outside its declared migration',()=>{
    const files=JSON.parse(readFileSync('docs/v0.4-core-baseline.json','utf8')) as {path:string;sha256:string}[];
    const changed=new Set(['ladders.ts','mining.ts','model.ts','motion.ts','levels.ts','simulation.ts','first-burrow.ts','boulders.ts']);
    for(const file of files){if(changed.has(file.path.split(/[\\/]/).at(-1)??''))continue;expect(createHash('sha256').update(readFileSync(file.path.replaceAll('\\','/'))).digest('hex').toUpperCase(),file.path).toBe(file.sha256);}
});
it('all nine campaign routes have exact grid timing, preserved B rewards and deterministic discovery',()=>{
    const baseline=JSON.parse(readFileSync('docs/v0.4-replay-baseline.json','utf8')) as {level:string;power:number;tick:number;wallet:number}[];
    for(const entry of baseline){const index=adventureLevels.findIndex(l=>l.id===entry.level),level=adventureLevels[index];if(!level)throw new Error('Missing level');const s=solve(createState(level,0,entry.power),index);expect(s.status).toBe('won');expect(s.tick).toBe([[1191,999,999],[1349,989,989],[2035,1339,1051]][index]?.[entry.power-1]);expect(s.wallet).toBe(entry.wallet+(entry.level==='golden-depths'?12:0));expect(s).toEqual(solve(createState(level,0,entry.power),index));}
});
