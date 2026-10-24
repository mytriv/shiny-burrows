import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { adventureLevels } from '../../src/content/levels/first-burrow';
import { createState } from '../../src/core/levels';
import { solve } from '../levels/v3-routes';
it('v0.4 preserves every Core and authored-content file byte for byte',()=>{
    const files=JSON.parse(readFileSync('docs/v0.4-core-baseline.json','utf8')) as {path:string;sha256:string}[];
    for(const file of files)expect(createHash('sha256').update(readFileSync(file.path.replaceAll('\\','/'))).digest('hex').toUpperCase(),file.path).toBe(file.sha256);
});
it('all nine pre-migration full-level replays retain identical states, ticks and rewards',()=>{
    const baseline=JSON.parse(readFileSync('docs/v0.4-replay-baseline.json','utf8')) as {level:string;power:number;sha256:string}[];
    for(const entry of baseline){const index=adventureLevels.findIndex(l=>l.id===entry.level),level=adventureLevels[index];if(!level)throw new Error('Missing level');const s=solve(createState(level,0,entry.power),index);expect(createHash('sha256').update(JSON.stringify(s)).digest('hex')).toBe(entry.sha256);}
});
