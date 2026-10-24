import {expect,it} from 'vitest';
import {Group,OrthographicCamera,Vector3} from 'three';
import {elevatedCamera,COS,SIN} from '../../src/presentation/three/coordinates';
import {tileSeed,seeded} from '../../src/presentation/three/variation';
import {cameraConfig} from '../../src/app/camera';
import {MoleView,type MoleAnimation} from '../../src/presentation/three/MoleView';
import {Resources} from '../../src/presentation/three/geometry';
it('tile variations are stable and differ across coordinates and material',()=>{
 const a=seeded(tileSeed(2,7,'soil')),b=seeded(tileSeed(2,7,'soil'));expect(Array.from({length:12},()=>a())).toEqual(Array.from({length:12},()=>b()));
 expect(tileSeed(2,7,'soil')).not.toBe(tileSeed(3,7,'soil'));expect(tileSeed(2,7,'soil')).not.toBe(tileSeed(2,7,'hard'));
});
it('clay surfaces remain deterministic across renderer recreation and reuse shared textures',()=>{
 const a=new Resources(),b=new Resources();
 expect(a.clayTexture.image.data).toEqual(b.clayTexture.image.data);
 expect(a.clayNormals.image.data).toEqual(b.clayNormals.image.data);
 expect(new Set(a.clayTexture.image.data).size).toBeGreaterThan(20);
 expect(a.terrainMaterial()).toBe(a.terrainMaterial());
 expect(a.terrainMaterial().normalMap).toBe(a.clayNormals);
 a.dispose();b.dispose();
});
it('six gait samples alternate legs, swing opposing arms and move body/head in both directions',()=>{
 const r=new Resources(),m=new MoleView(r);
 for(const facing of [-1,1]){const samples=[0,2,4,6,8,10].map(t=>{m.pose('walk',t,facing,false);return m.sample();});expect(new Set(samples.map(p=>JSON.stringify(p))).size).toBe(6);expect(Math.max(...samples.map(p=>p.bodyY))-Math.min(...samples.map(p=>p.bodyY))).toBeGreaterThan(.5);for(const p of samples)expect((p.legs[0]??0)*(p.legs[1]??0)).toBeLessThanOrEqual(0);}
 for(const mode of ['dig-left','dig-right','dig-up','dig-down'] as MoleAnimation[]){const samples=[0,4,8,14,18,23].map(age=>{m.pose(mode,age,1,false,age);return m.sample();});expect(new Set(samples.map(p=>JSON.stringify(p.arms))).size).toBeGreaterThanOrEqual(4);}
 r.dispose();
});
it('elevated camera preserves square frontal grid and projects a visible top surface',()=>{
 const world=new Group(),camera=new OrthographicCamera(),c=cameraConfig(390,600,512,864);elevatedCamera(world,camera,{x:0,y:0},c);world.updateMatrixWorld();
 const project=(x:number,y:number,z:number)=>new Vector3(x,y/COS,z).project(camera).multiply(new Vector3(390/2,600/2,1));
 const a=project(32,-32,0),b=project(64,-64,0);expect(Math.abs(b.x-a.x)).toBeCloseTo(Math.abs(b.y-a.y),6);
 expect(project(32,-32,-16).y-a.y).toBeCloseTo(16*SIN*c.zoom,6);
});
