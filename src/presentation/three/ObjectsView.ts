import { Group, Mesh, Color } from 'three';
import type { GameState,GameEvent,Boulder } from '../../core/model';
import {FALL_TICKS} from '../../core/traversal';
import {isDiscovered} from '../../core/discovery';
import { platformTarget,validatePlatform } from '../../core/platforms';
import { Batch } from './Batch';
import { Resources } from './geometry';
import { cellPoint,renderPoint } from './coordinates';

export class ObjectsView {
    readonly root=new Group();
    private rails:Batch;private rungs:Batch;private planks:Batch;private rocks:Batch;private gems:Batch;
    private preview:Mesh;
    private exit=new Group();
    private impacts=new Map<string,number>();
    private bolts:Batch;
    constructor(private r:Resources,capacity=1024){
        this.rails=new Batch(r.rail,r.matte('#b5804a'),capacity*2);this.rungs=new Batch(r.rung,r.matte('#f0c483'),capacity*3);
        this.planks=new Batch(r.plank,r.matte('#dbab67'),capacity);this.rocks=new Batch(r.boulder,r.matte('#98849e'),64);this.gems=new Batch(r.facet,r.gold(),64);this.rocks.mesh.name='falling-boulders';
        this.preview=new Mesh(r.plank,r.flat('#9cddac',.55));
        this.bolts=new Batch(r.facet,r.matte('#e0c9a7'),capacity*6);this.bolts.mesh.name='ladder-fasteners';
        const marker=new Mesh(r.disc,r.flat('#317b58'));marker.scale.set(10,10,1);this.exit.add(marker);
        for(const sign of [-1,1]){const arrow=new Mesh(r.box,r.flat('#d3ffc9'));arrow.scale.set(8,2,2);arrow.position.set(sign*2.5,0,2);arrow.rotation.z=sign*.65;this.exit.add(arrow);}
        this.root.add(this.rails.mesh,this.rungs.mesh,this.planks.mesh,this.rocks.mesh,this.gems.mesh,this.preview,this.exit,this.bolts.mesh);
    }
    reset():void {this.impacts.clear();}
    effects(events:readonly GameEvent[],s:GameState):void {for(const e of events)if(e.type==='BoulderImpact')this.impacts.set(e.id,s.tick);}
    sync(s:GameState,previous:GameState,alpha:number,reduced=false):void {
        this.rails.clear();this.rungs.clear();this.planks.clear();this.rocks.clear();this.gems.clear();this.bolts.clear();
        for(const cell of s.ladders){if(!isDiscovered(s,cell.y*s.level.width+cell.x))continue;const p=cellPoint(cell,1.5);for(const dx of [-10.5,10.5])this.rails.add([p[0]+dx,p[1],p[2]]);for(const dy of [-10,0,10]){this.rungs.add([p[0],p[1]+dy,3],[1,1,1],Math.PI/2);for(const dx of [-10.5,10.5])this.bolts.add([p[0]+dx,p[1]+dy,4.6],[1,1,.6]);}}
        for(const cell of s.platforms){if(!isDiscovered(s,cell.y*s.level.width+cell.x))continue;const p=cellPoint(cell,4);this.planks.add([p[0],p[1]+13,p[2]]);}
        for(const rock of s.boulders){if(!isDiscovered(s,Math.floor((rock.position.y+16)/32)*s.level.width+Math.floor((rock.position.x+16)/32)))continue;const old=previous.boulders.find(b=>b.id===rock.id)??rock,pose=boulderPose(rock,s.tick,s.tick-(this.impacts.get(rock.id)??-100),reduced);const from=rock.fallFrom??old.position,t=rock.fallFrom?Math.max(0,Math.min(1,(s.tick-1+alpha-(rock.nextFallTick??s.tick)+FALL_TICKS)/FALL_TICKS)):alpha,p={x:from.x+(rock.position.x-from.x)*t+16,y:from.y+(rock.position.y-from.y)*t+32-pose.y};this.rocks.add(renderPoint(p,7),[pose.x,pose.y,13.5],pose.angle,new Color(rock.warningTicks>0?'#f6c4a2':'#ffffff'));}
        this.exit.visible=false;
        for(const overlay of s.level.overlays){if(!isDiscovered(s,overlay.cell.y*s.level.width+overlay.cell.x)||s.collectedLootIds.includes(overlay.id))continue;if(overlay.kind==='exit'){this.exit.position.set(...cellPoint(overlay.cell,4));this.exit.visible=true;}else this.gems.add(cellPoint(overlay.cell,5),[7,9,5],Math.PI/4);}
        const cell=platformTarget(s),p=cellPoint(cell,6);this.preview.position.set(p[0],p[1]+13,p[2]);this.preview.visible=s.inventory.platforms>0&&s.status==='playing';
        this.preview.material=this.r.flat(validatePlatform(s)===null?'#9cddac':'#df9a87',.55);
        for(const b of [this.rails,this.rungs,this.planks,this.rocks,this.gems,this.bolts])b.commit();
    }
    dispose():void {for(const b of [this.rails,this.rungs,this.planks,this.rocks,this.gems,this.bolts])b.dispose();this.root.removeFromParent();}
}

/** Every pose stays within the unchanged square collision cell, including landing compression. */
export function boulderPose(rock:Boulder,tick:number,impactAge:number,reduced=false):Readonly<{x:number;y:number;angle:number}> {
    if(reduced)return {x:14.8,y:14.8,angle:0};
    const impact=impactAge>=0&&impactAge<10?1-impactAge/10:0,falling=rock.falling&&rock.warningTicks===0;
    return {x:impact?14.8+impact*.8:falling?14.1:14.8,y:impact?14.8-impact*2.3:falling?15.7:14.8,angle:rock.warningTicks>0?Math.sin(tick*1.5)*.055:falling?tick*.065:0};
}
