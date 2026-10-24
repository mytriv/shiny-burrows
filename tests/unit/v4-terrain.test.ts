import {revealAll} from '../fixtures/discovery';
import {expect,it} from 'vitest';
import {createState} from '../../src/core/levels';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {TerrainView} from '../../src/presentation/three/TerrainView';
import {Resources} from '../../src/presentation/three/geometry';
it('terrain instances match logical solids and restore crack appearance after regeneration without mutating state',()=>{
 const r=new Resources(),view=new TerrainView(r),s=revealAll(createState(firstBurrow)),before=JSON.stringify(s);view.sync(s);
 expect(view.counts.tiles).toBe(s.tiles.filter(t=>t.kind!=='empty').length);expect(view.counts.nuggets).toBe(20);expect(JSON.stringify(s)).toBe(before);
 const tile=s.tiles[66];if(!tile)throw new Error('Fixture');
 view.sync({...s,tiles:s.tiles.map((t,i)=>i===66?{...t,currentIntegrity:1}:t)});expect(view.counts.cracks).toBeGreaterThan(0);
 view.sync(s);expect(view.counts.cracks).toBe(0);
 view.sync({...s,tiles:s.tiles.map((t,i)=>i===66?{kind:'empty'}:t)});expect(view.counts.tiles).toBe(s.tiles.filter(t=>t.kind!=='empty').length-1);
 view.dispose();r.dispose();
});

