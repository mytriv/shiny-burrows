import {revealAll} from '../fixtures/discovery';
import {expect,it} from 'vitest';
import {Box3} from 'three';
import {createState} from '../../src/core/levels';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {Resources} from '../../src/presentation/three/geometry';
import {ObjectsView} from '../../src/presentation/three/ObjectsView';
import {Particles} from '../../src/presentation/three/Particles';
it('ladder geometry stays in its assigned cell and platform visible top exactly matches collision top',()=>{
 const r=new Resources(),view=new ObjectsView(r);const s={...revealAll(createState(firstBurrow)),ladders:[{x:2,y:5}],platforms:[{x:3,y:7}]};view.sync(s,s,1);view.root.updateMatrixWorld(true);
 for(const child of view.root.children.slice(0,2)){const b=new Box3().setFromObject(child);expect(b.min.x).toBeGreaterThanOrEqual(64);expect(b.max.x).toBeLessThanOrEqual(96);expect(b.min.y).toBeGreaterThanOrEqual(-192);expect(b.max.y).toBeLessThanOrEqual(-160);}
 const plank=view.root.children[2];if(!plank)throw new Error('Missing platform');const b=new Box3().setFromObject(plank);expect(b.min.x).toBe(96);expect(b.max.x).toBe(128);expect(b.max.y).toBe(-224);
 view.dispose();r.dispose();
});
it('effects remain bounded, expire, respect reduced motion and never mutate authoritative state',()=>{
 const r=new Resources(),particles=new Particles(r),s=revealAll(createState(firstBurrow)),before=JSON.stringify(s);
 for(let i=0;i<50;i++)particles.emit([{type:'TileDug',cell:{x:2,y:4}}],s,false);
 expect(particles.count).toBe(48);particles.step(.1);expect(particles.batch.mesh.count).toBe(48);particles.step(1);expect(particles.count).toBe(0);
 particles.emit([{type:'TreasureCollected',id:'visual',value:5}],s,true);expect(particles.count).toBe(0);expect(JSON.stringify(s)).toBe(before);
 particles.dispose();r.dispose();
});
