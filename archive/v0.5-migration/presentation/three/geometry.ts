import { BoxGeometry, BufferGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, MeshLambertMaterial, MeshBasicMaterial, Material, Color } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Rounded edges remain inside an exact square XY footprint; one low-poly bevel segment. */
export function beveledBox(width: number, height: number, depth: number, bevel: number): BufferGeometry {
    const geometry = new RoundedBoxGeometry(width,height,depth,1,bevel);geometry.computeBoundingBox();
    return geometry;
}
export class Resources {
    readonly tile = beveledBox(32,32,8,2.4);
    readonly sphere = new SphereGeometry(1,12,8);
    readonly box = new BoxGeometry(1,1,1);
    readonly rail = new CylinderGeometry(1.5,1.5,32,7);
    readonly rung = new CylinderGeometry(1.25,1.25,16,7);
    readonly plank = beveledBox(32,6,7,1);
    readonly claw = new ConeGeometry(.65,2.5,7);
    readonly materials = new Map<string,Material>();
    matte(color: number|string): MeshLambertMaterial {
        const key='lit'+color;let mat=this.materials.get(key);
        if(!mat){mat=new MeshLambertMaterial({color});this.materials.set(key,mat);}return mat as MeshLambertMaterial;
    }
    flat(color: number|string,opacity=1): MeshBasicMaterial {
        const key='flat'+color+':'+opacity;let mat=this.materials.get(key);
        if(!mat){mat=new MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});this.materials.set(key,mat);}return mat as MeshBasicMaterial;
    }
    dispose():void { for(const g of [this.tile,this.sphere,this.box,this.rail,this.rung,this.plank,this.claw])g.dispose();for(const m of this.materials.values())m.dispose(); }
}
export const TERRAIN_COLORS = { soil:'#b87946', compacted:'#995c40', gravel:'#889594', hard:'#526a7c', stone:'#657889', bedrock:'#465160', fragile:'#ca9c76', ore_soil:'#b87946', empty:'#4c414d' };
export function variation(color: string, index: number): Color { return new Color(color).multiplyScalar(.97+(index*17%7)*.01); }
