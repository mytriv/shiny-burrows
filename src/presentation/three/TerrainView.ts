import {Group,Color} from 'three';
import type {GameState} from '../../core/model';
import {isDiscovered} from '../../core/discovery';
import {depositTier,DEPOSIT_NUGGETS,goldHintAt} from '../../core/deposits';
import {cellPoint,VISUAL,SIN} from './coordinates';
import {Resources,TERRAIN_COLORS} from './geometry';
import {Batch} from './Batch';
import {seeded,tileSeed} from './variation';

type Chunk={start:number;end:number;bases:Batch[];fog:Batch;edge:Batch;nuggets:Batch;stones:Batch;pits:Batch;fissures:Batch;cracks:Batch;shadows:Batch;glow:Batch;hints:Batch};
function batches(c:Chunk):Batch[]{return [...c.bases,c.fog,c.edge,c.nuggets,c.stones,c.pits,c.fissures,c.cracks,c.shadows,c.glow,c.hints];}
export class TerrainView {
    readonly root=new Group();
    private chunks:Chunk[]=[];
    private previous:GameState|undefined;
    private width=0;private height=0;private rebuilds=0;
    constructor(private r:Resources){}
    sync(s:GameState):void {
        if(this.previous?.tiles===s.tiles&&this.previous.discovered===s.discovered&&this.previous.level===s.level)return;
        if(this.width!==s.level.width||this.height!==s.level.height){
            for(const c of this.chunks)for(const b of batches(c))b.dispose();this.chunks=[];this.width=s.level.width;this.height=s.level.height;this.previous=undefined;
            for(let y=0;y<this.height;y+=8){
                const capacity=this.width*Math.min(8,this.height-y),bases=[...this.r.tiles,...this.r.oreTiles].map((g,i)=>{const b=new Batch(g,this.r.terrainMaterial(),capacity);b.mesh.name=i>=4?'solid-gold-bearing-soil':'solid-terrain';return b;});
                const c:Chunk={start:y*this.width,end:Math.min(y+8,this.height)*this.width,bases,
                    fog:new Batch(this.r.box,this.r.flat('#29191d'),capacity),edge:new Batch(this.r.box,this.r.fogEdge(),capacity),nuggets:new Batch(this.r.facet,this.r.gold(),capacity*7),
                    stones:new Batch(this.r.facet,this.r.matte('#ffffff'),capacity*12),pits:new Batch(this.r.disc,this.r.flat('#362128',.48),capacity*3),
                    fissures:new Batch(this.r.box,this.r.flat('#633323',.25),capacity*3),cracks:new Batch(this.r.box,this.r.flat('#271e28'),capacity*9),
                    shadows:new Batch(this.r.box,this.r.flat('#180f1a',.36),capacity*4),glow:new Batch(this.r.disc,this.r.glow(),capacity),hints:new Batch(this.r.facet,this.r.gold(),capacity*2)};
                c.nuggets.mesh.name='embedded-gold-nuggets';c.hints.mesh.name='gold-proximity-flecks';c.fog.mesh.name='undiscovered-cells';c.edge.mesh.name='feathered-discovery-boundary';
                this.chunks.push(c);this.root.add(...batches(c).map(b=>b.mesh));
            }
        }
        for(const chunk of this.chunks){
            const previous=this.previous;let dirty=!previous||previous.level!==s.level;
            for(let i=chunk.start;previous&&!dirty&&i<chunk.end;i++)dirty=previous.tiles[i]!==s.tiles[i]||isDiscovered(previous,i)!==isDiscovered(s,i)||this.neighborChanged(previous,s,i)||goldHintAt(previous,i)!==goldHintAt(s,i);
            if(!dirty)continue;
            for(const b of batches(chunk))b.clear();this.rebuilds++;
        for(let i=chunk.start;i<chunk.end;i++){
            const t=s.tiles[i];if(!t)continue;const x=i%this.width,y=Math.floor(i/this.width),at=cellPoint({x,y});
            if(!isDiscovered(s,i)){chunk.fog.add(at,[32,32,.05]);continue;}
            const hidden=(dx:number,dy:number)=>x+dx>=0&&x+dx<this.width&&y+dy>=0&&y+dy<this.height&&!isDiscovered(s,(y+dy)*this.width+x+dx);
            const mask=(hidden(-1,0)?1:0)+(hidden(1,0)?2:0)+(hidden(0,-1)?4:0)+(hidden(0,1)?8:0);
            const corners=(hidden(-1,-1)?1:0)+(hidden(1,-1)?2:0)+(hidden(-1,1)?4:0)+(hidden(1,1)?8:0);
            if(mask||corners)chunk.edge.add([at[0],at[1]+9*SIN,9],[32,32,.01],0,new Color(mask/15,corners/15,0));
            if(t.kind==='empty')continue;
            const kind=t.kind==='ore_soil'?t.oreStratum??'soil':t.kind,seed=tileSeed(x,y,kind),random=seeded(seed);
            const tint=new Color(TERRAIN_COLORS[t.kind==='ore_soil'?'soil':kind]).multiplyScalar(.9+random()*.2);
            const hint=goldHintAt(s,i);if(hint)tint.lerp(new Color('#e39c48'),.23);
            chunk.bases[seed%4+(t.kind==='ore_soil'?4:0)]?.add(at,[1,1,1],0,tint);
            const hard=kind==='gravel'||kind==='hard'||kind==='stone'||kind==='bedrock';
            const damage=t.maxIntegrity?1-(t.currentIntegrity??t.maxIntegrity)/t.maxIntegrity:0;
            if(t.kind==='ore_soil'){
                chunk.glow.add([at[0],at[1],-.3],[11,10,1]);
                for(const [dx,dy,size] of ([[-5,-2,6.6],[3,3,7.4],[7,-6,3.2],[-8,7,1.8],[4,-9,1.3],[-1,9,2.8],[9,4,2.1]] as const).slice(0,DEPOSIT_NUGGETS[depositTier(t.lootValue??0)]))chunk.nuggets.add([at[0]+dx,at[1]+dy,-.8],[size,size*.86,4.1],random()*.6);
                // Earth remains continuous around the shallow sculpted deposit.
                for(const [dx,dy] of [[-11,-10],[11,9],[-11,10]] as const)chunk.stones.add([at[0]+dx,at[1]+dy,.2],[2.4,2,1.2],random(),tint);
            }else{
                if(hard&&kind!=='bedrock')chunk.stones.add([at[0]+(random()-.5)*5,at[1]+(random()-.5)*5,1],[10,9,3],random(),new Color('#a69ab1').lerp(tint,.35));
                for(let n=0;n<2;n++)chunk.stones.add([at[0]+(random()-.5)*11,at[1]+(random()-.5)*14,-.15],[3.5+random()*3,3+random()*2,1.2],random(),tint.clone().multiplyScalar(n?.91:1.08));
                for(let n=0;n<(hard?4:3);n++){
                    const dx=(random()-.5)*21,dy=(random()-.5)*21,size=(hard?2.3:n===0?3.2:1.3)+random()*(hard?2:1.6);
                    const color=new Color(hard?'#b3a7b7':n===0?'#ad8ca1':'#dd8a4d').lerp(tint,.22+random()*.3);
                    chunk.stones.add([at[0]+dx,at[1]+dy,.25+damage*.8],[size,size*(.6+random()*.35),1.2+random()*1.3],random()*3,color);
                }
                for(let n=0;n<2;n++)chunk.pits.add([at[0]+(random()-.5)*21,at[1]+(random()-.5)*21,.4],[1.1+random(),.6+random()*.6,1]);
                for(let n=0;n<2;n++)chunk.stones.add([at[0]+(random()-.5)*24,at[1]+(random()-.5)*24,-.1],[1.1+random(),.8+random(),.55],random()*3,tint.clone().multiplyScalar(.83+random()*.32));
                const dx=(random()-.5)*12,dy=(random()-.5)*12;
                chunk.fissures.add([at[0]+dx,at[1]+dy,.7],[.45,5+random()*4,.2],random()-.5);
                chunk.fissures.add([at[0]+dx+1.8,at[1]+dy+2,.7],[.4,4,.2],.8);
            }
            if(hint)for(const dx of [-7,4])chunk.hints.add([at[0]+dx,at[1]+3,-.25],[1.6,1.2,.9],.35);
            const stage=kind==='fragile'?Math.max(1,Math.ceil(damage*3)):Math.ceil(damage*3);
            for(let n=0;n<stage;n++){
                const dx=n*4-4,dy=n*3-3;
                chunk.cracks.add([at[0]+dx,at[1]+dy,8],[1+damage*.5,13,.3],-.45);
                chunk.cracks.add([at[0]+dx+3,at[1]+dy+2,8],[.8,8,.3],.8);
                chunk.cracks.add([at[0]+dx-3,at[1]+dy-3,8],[.7,5,.3],1.1);
            }
            // Contact shading on cavity backing, never a gameplay obstruction.
            for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]] as const){const nx=x+dx,ny=y+dy;if(s.tiles[ny*this.width+nx]?.kind==='empty')chunk.shadows.add([at[0]+dx*16,at[1]-dy*16,-VISUAL.depth-.5],[dx?5:31,dy?5:31,.2]);}
        }
            for(const b of batches(chunk))b.commit();
        }
        this.previous=s;
    }
    private neighborChanged(a:GameState,b:GameState,i:number):boolean {
        const x=i%this.width,y=Math.floor(i/this.width);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<this.width&&y+dy>=0&&y+dy<this.height&&isDiscovered(a,(y+dy)*this.width+x+dx)!==isDiscovered(b,(y+dy)*this.width+x+dx))return true;
        return false;
    }
    get counts():Readonly<{tiles:number;nuggets:number;cracks:number;stones:number;pits:number;fog:number;hints:number;rebuilds:number;instances:number}>{
        const count=(key:'nuggets'|'cracks'|'stones'|'pits'|'fog'|'hints')=>this.chunks.reduce((n,c)=>n+c[key].mesh.count,0);
        return {tiles:this.chunks.reduce((n,c)=>n+c.bases.reduce((a,b)=>a+b.mesh.count,0),0),nuggets:count('nuggets'),cracks:count('cracks'),stones:count('stones'),pits:count('pits'),fog:count('fog'),hints:count('hints'),rebuilds:this.rebuilds,instances:this.chunks.reduce((n,c)=>n+batches(c).reduce((a,b)=>a+b.mesh.count,0),0)};
    }
    dispose():void {for(const c of this.chunks)for(const b of batches(c))b.dispose();this.root.removeFromParent();}
}
