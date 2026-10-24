import {expect,it} from 'vitest';
import {Resources} from '../../src/presentation/three/geometry';
import {MoleView,type MoleAnimation} from '../../src/presentation/three/MoleView';
it('complete mole including claws and whiskers stays within one cell and collider envelope in every animation',()=>{
 const r=new Resources(),mole=new MoleView(r);
 const animations:MoleAnimation[]=['idle','walk','climb','fall','land','collect','upgrade','dig-up','dig-down','dig-left','dig-right'];
 for(const facing of [-1,1])for(const mode of animations)for(let tick=0;tick<100;tick++){mole.pose(mode,tick,facing,false);const bounds=mole.bounds();expect(bounds.width,mode).toBeLessThanOrEqual(20);expect(bounds.height,mode).toBeLessThanOrEqual(26);}
 r.dispose();
});

