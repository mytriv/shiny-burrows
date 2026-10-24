import { Group, Color } from 'three';
import type { GameState, Tile } from '../../core/model';
import { cellPoint } from './coordinates';
import { Resources, TERRAIN_COLORS, variation } from './geometry';
import { Batch } from './Batch';

export class TerrainView {
    readonly root=new Group();
    private chunks:Batch[]=[];
    private readonly nuggets:Batch;
    private readonly details:Batch;
    private readonly cracks:Batch;
    private tiles:readonly Tile[]=[];
    private width=0;
    private height=0;
    constructor(private r:Resources,capacity=1024){
        this.nuggets=new Batch(r.sphere,r.matte('#ffc84d'),capacity*3);
        this.details=new Batch(r.sphere,r.matte('#ffffff'),capacity);
        this.cracks=new Batch(r.box,r.flat('#473a3b'),capacity*8);
        this.root.add(this.nuggets.mesh,this.details.mesh,this.cracks.mesh);
    }
    sync(s:GameState):void {
        if(this.tiles===s.tiles)return;
        if(this.width!==s.level.width||this.height!==s.level.height){
            for(const c of this.chunks)c.dispose();this.chunks=[];this.width=s.level.width;this.height=s.level.height;
            for(let y=0;y<this.height;y+=8){const batch=new Batch(this.r.tile,this.r.matte('#ffffff'),this.width*8);this.chunks.push(batch);this.root.add(batch.mesh);}
        }
        for(const b of this.chunks)b.clear();this.nuggets.clear();this.details.clear();this.cracks.clear();
        s.tiles.forEach((t,i)=>{
            if(t.kind==='empty')return;
            const cell={x:i%this.width,y:Math.floor(i/this.width)},at=cellPoint(cell),chunk=this.chunks[Math.floor(cell.y/8)];
            const kind=t.kind==='ore_soil'?t.oreStratum??'soil':t.kind;
            chunk?.add(at,[1,1,1],0,variation(TERRAIN_COLORS[kind],i));
            if(t.kind==='ore_soil'){
                for(const [dx,dy,size] of [[-6,-3,4.5],[4,3,5],[7,-6,3]])this.nuggets.add([at[0]+(dx??0),at[1]+(dy??0),4.5],[size??4,(size??4)*.8,2.5]);
            }else if(kind==='gravel'||kind==='hard'||kind==='stone'){
                this.details.add([at[0]-5,at[1]+4,4],[5,2.7,.7],-.3,variation(kind==='hard'?'#8298a4':'#b0bcb8',i));
            }else if(i%5===0&&kind!=='bedrock')this.details.add([at[0]+7,at[1]-6,4],[2,1.2,.5],0,new Color('#cda376'));
            const damage=t.maxIntegrity?1-(t.currentIntegrity??t.maxIntegrity)/t.maxIntegrity:0;
            const stage=kind==='fragile'?Math.max(1,Math.ceil(damage*3)):Math.ceil(damage*3);
            // Cracks sit entirely inside the frontal face; healed tiles contribute no instances.
            for(let n=0;n<stage;n++){
                const dx=n*4-4,dy=n*3-3;
                this.cracks.add([at[0]+dx,at[1]+dy,7.2],[.9,11, .3],-.45);
                this.cracks.add([at[0]+dx+3,at[1]+dy+2,7.3],[.8,6,.3],.7);
            }
        });
        for(const b of [...this.chunks,this.nuggets,this.details,this.cracks])b.commit();this.tiles=s.tiles;
    }
    get counts():Readonly<{tiles:number;nuggets:number;cracks:number}>{return {tiles:this.chunks.reduce((n,b)=>n+b.mesh.count,0),nuggets:this.nuggets.mesh.count,cracks:this.cracks.mesh.count};}
    dispose():void {for(const b of [...this.chunks,this.nuggets,this.details,this.cracks])b.dispose();this.root.removeFromParent();}
}
