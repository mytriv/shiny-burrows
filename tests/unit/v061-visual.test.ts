import {revealAll} from '../fixtures/discovery';
import {expect,it} from 'vitest';
import {InstancedMesh,Matrix4,Vector3} from 'three';
import {Resources} from '../../src/presentation/three/geometry';
import {VISUAL} from '../../src/presentation/three/coordinates';
import {TerrainView} from '../../src/presentation/three/TerrainView';
import {ObjectsView,boulderPose} from '../../src/presentation/three/ObjectsView';
import {createState} from '../../src/core/levels';
import {firstBurrow} from '../../src/content/levels/first-burrow';
it('every ordinary and gold terrain variant has the same complete 32×32 solid bounds',()=>{
 const r=new Resources();
 for(const g of [...r.tiles,...r.oreTiles]){const b=g.boundingBox;if(!b)throw new Error('Missing bounds');expect(b.getSize(new Vector3()).toArray()).toEqual([32,32,VISUAL.depth]);expect(b.max.z).toBeCloseTo(0,5);expect(b.min.z).toBe(-VISUAL.depth);}
 const p=r.oreTiles[0]?.getAttribute('position');if(!p)throw new Error('Missing geometry');let recessed=0;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.01&&Math.abs(p.getY(i))<.01&&p.getZ(i)<-2.5)recessed++;expect(recessed).toBeGreaterThan(0);r.dispose();
});
it('gold cells keep opaque earth and their nuggets intersect its front rather than floating in holes',()=>{
 const r=new Resources(),view=new TerrainView(r),s=revealAll(createState(firstBurrow));view.sync(s);
 const bases=view.root.children.filter(c=>c.name==='solid-gold-bearing-soil') as InstancedMesh[];
 expect(bases.reduce((n,b)=>n+b.count,0)).toBe(8);for(const b of bases)expect((b.material as {transparent:boolean}).transparent).toBe(false);
 const golds=view.root.children.filter(c=>c.name==='embedded-gold-nuggets') as InstancedMesh[];expect(golds.reduce((n,b)=>n+b.count,0)).toBe(20);
 for(const gold of golds)
 for(let i=0;i<gold.count;i++){const m=new Matrix4(),p=new Vector3(),scale=new Vector3();gold.getMatrixAt(i,m);p.setFromMatrixPosition(m);scale.setFromMatrixScale(m);expect(p.z).toBeLessThan(0);expect(p.z+scale.z).toBeGreaterThan(0);expect(p.z-scale.z).toBeLessThan(-2);}
 view.dispose();r.dispose();
});
it('falling rocks are rounded faceted volumes and every warning/fall/impact pose fits a square cell',()=>{
 const r=new Resources(),p=r.boulder.getAttribute('position'),b=r.boulder.boundingBox;if(!b)throw new Error('Missing bounds');const size=b.getSize(new Vector3());expect(size.y/size.x).toBeGreaterThan(.8);expect(size.z/size.x).toBeGreaterThan(.8);
 const radii=new Set<number>();for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));expect(radius).toBeLessThanOrEqual(1);radii.add(Math.round(radius*100));}expect(radii.size).toBeGreaterThan(5);
 const rock={id:'test',position:{x:0,y:0},velocityY:120,falling:true,warningTicks:0};
 for(let tick=0;tick<100;tick++)for(const warningTicks of [0,5])for(const age of [0,5,15]){const pose=boulderPose({...rock,warningTicks},tick,age);expect(Math.max(pose.x,pose.y)).toBeLessThanOrEqual(16);expect(Math.min(pose.x,pose.y)).toBeGreaterThan(12);}
 expect(boulderPose(rock,20,0)).not.toEqual(boulderPose(rock,20,15));r.dispose();
});
it('landing feedback resets without changing authoritative rock state',()=>{
 const r=new Resources(),view=new ObjectsView(r),base=revealAll(createState(firstBurrow)),s={...base,tick:30,boulders:[{id:'test',position:{x:160,y:160},velocityY:0,falling:false,warningTicks:0}]},before=JSON.stringify(s);
 view.effects([{type:'BoulderImpact',id:'test',at:{x:160,y:192}}],s);view.sync(s,s,1);const rock=view.root.getObjectByName('falling-boulders') as InstancedMesh,m=new Matrix4();rock.getMatrixAt(0,m);const impact=m.clone();view.reset();view.sync(s,s,1);rock.getMatrixAt(0,m);expect(m.equals(impact)).toBe(false);expect(JSON.stringify(s)).toBe(before);view.dispose();r.dispose();
});
