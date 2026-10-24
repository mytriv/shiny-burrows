import { Group, Mesh, Color } from 'three';
import type { GameState } from '../../core/model';
import { platformTarget,validatePlatform } from '../../core/platforms';
import { Batch } from './Batch';
import { Resources } from './geometry';
import { cellPoint,renderPoint } from './coordinates';

export class ObjectsView {
    readonly root=new Group();
    private rails:Batch;private rungs:Batch;private planks:Batch;private rocks:Batch;private gems:Batch;
    private preview:Mesh;
    private exit=new Group();
    constructor(private r:Resources,capacity=1024){
        this.rails=new Batch(r.rail,r.matte('#b5804a'),capacity*2);this.rungs=new Batch(r.rung,r.matte('#f0c483'),capacity*3);
        this.planks=new Batch(r.plank,r.matte('#dbab67'),capacity);this.rocks=new Batch(r.sphere,r.matte('#74828c'),64);this.gems=new Batch(r.sphere,r.matte('#70dfd1'),64);
        this.preview=new Mesh(r.plank,r.flat('#9cddac',.55));
        for(const x of [-10,10]){const post=new Mesh(r.box,r.matte('#449b76'));post.position.set(x,0,0);post.scale.set(3,25,6);this.exit.add(post);}
        const top=new Mesh(r.plank,r.matte('#74cb92'));top.scale.x=.85;top.position.y=12;this.exit.add(top);
        const arrow=new Mesh(r.box,r.matte('#d3ffc9'));arrow.scale.set(8,2,2);arrow.position.set(0,0,4);arrow.rotation.z=-.6;this.exit.add(arrow);
        this.root.add(this.rails.mesh,this.rungs.mesh,this.planks.mesh,this.rocks.mesh,this.gems.mesh,this.preview,this.exit);
    }
    sync(s:GameState,previous:GameState,alpha:number):void {
        this.rails.clear();this.rungs.clear();this.planks.clear();this.rocks.clear();this.gems.clear();
        for(const cell of s.ladders){const p=cellPoint(cell,1.5);for(const dx of [-8,8])this.rails.add([p[0]+dx,p[1],p[2]]);for(const dy of [-10,0,10])this.rungs.add([p[0],p[1]+dy,3],[1,1,1],Math.PI/2);}
        for(const cell of s.platforms){const p=cellPoint(cell,4);this.planks.add([p[0],p[1]+13,p[2]]);}
        for(const rock of s.boulders){const old=previous.boulders.find(b=>b.id===rock.id)??rock;const p={x:old.position.x+(rock.position.x-old.position.x)*alpha+16,y:old.position.y+(rock.position.y-old.position.y)*alpha+16};this.rocks.add(renderPoint(p,5),[15,15,7],0,new Color(rock.warningTicks>0||rock.falling?'#a5a6a1':'#ffffff'));}
        this.exit.visible=false;
        for(const overlay of s.level.overlays){if(s.collectedLootIds.includes(overlay.id))continue;if(overlay.kind==='exit'){this.exit.position.set(...cellPoint(overlay.cell,4));this.exit.visible=true;}else this.gems.add(cellPoint(overlay.cell,5),[7,9,5],Math.PI/4);}
        const cell=platformTarget(s),p=cellPoint(cell,6);this.preview.position.set(p[0],p[1]+13,p[2]);this.preview.visible=s.inventory.platforms>0&&s.status==='playing';
        this.preview.material=this.r.flat(validatePlatform(s)===null?'#9cddac':'#df9a87',.55);
        for(const b of [this.rails,this.rungs,this.planks,this.rocks,this.gems])b.commit();
    }
    dispose():void {for(const b of [this.rails,this.rungs,this.planks,this.rocks,this.gems])b.dispose();this.root.removeFromParent();}
}
