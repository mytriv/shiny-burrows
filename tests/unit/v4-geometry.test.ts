import {expect,it} from 'vitest';
import {Box3,Vector3,OrthographicCamera} from 'three';
import {beveledBox} from '../../src/presentation/three/geometry';
import {cellPoint,molePoint,renderPoint,VISUAL} from '../../src/presentation/three/coordinates';
it('central conversion preserves square cell spacing and mirrors only logical Y',()=>{
 expect(cellPoint({x:2,y:3})).toEqual([80,-112,0]);expect(renderPoint({x:80,y:128},7)).toEqual([80,-128,7]);expect(molePoint({x:80,y:128})).toEqual([80,-115,20]);
 const g=beveledBox(32,32,8,1.5);const bounds=g.boundingBox;if(!bounds)throw new Error('Missing bounds');expect(bounds.getSize(new Vector3()).toArray()).toEqual([32,32,8]);g.dispose();expect(VISUAL.playerWidth).toBeLessThan(32);expect(VISUAL.playerHeight).toBeLessThan(32);
});
it.each([[390,600],[844,230],[1100,700]])('orthographic frontal projection is square at %s×%s',(w,h)=>{
 const zoom=2,c=new OrthographicCamera(0,w/zoom,0,-h/zoom,.1,2000);c.position.z=1000;c.updateMatrixWorld();
 const project=(p:Vector3)=>p.project(c).multiply(new Vector3(w/2,h/2,1));
 const a=project(new Vector3(32,-32,4)),b=project(new Vector3(64,-64,4));expect(Math.abs(a.x-b.x)).toBeCloseTo(Math.abs(a.y-b.y),8);
 const bounds=new Box3().setFromPoints([new Vector3(...cellPoint({x:0,y:0})),new Vector3(...cellPoint({x:1,y:1}))]);expect(bounds.max.x-bounds.min.x).toBe(32);expect(bounds.max.y-bounds.min.y).toBe(32);
});
