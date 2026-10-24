import { Color } from 'three';
import type { GameEvent,GameState } from '../../core/model';
import { Batch } from './Batch';
import { Resources } from './geometry';
import { cellPoint,molePoint,VISUAL } from './coordinates';
type Particle={x:number;y:number;z:number;vx:number;vy:number;age:number;life:number;size:number;color:Color;cx:number;cy:number};
export class Particles {
    readonly batch:Batch;
    private items:Particle[]=[];
    constructor(r:Resources){this.batch=new Batch(r.sphere,r.matte('#ffffff'),VISUAL.particleLimit);}
    clear():void {this.items=[];this.batch.clear();this.batch.commit();}
    emit(events:readonly GameEvent[],s:GameState,reduced:boolean):void {
        if(reduced)return;
        for(const e of events){
            if(e.type!=='TileHit'&&e.type!=='TileDug'&&e.type!=='TreasureCollected')continue;
            const gold=e.type==='TreasureCollected',p=gold?molePoint(s.player.position):cellPoint(e.cell,9);
            const tile=gold?undefined:s.level.tiles[e.cell.y*s.level.width+e.cell.x];
            const color=new Color(gold?'#ffe7a1':tile?.kind==='hard'||tile?.kind==='gravel'?'#b5c2c5':'#e3bd8a');
            for(let i=0;i<(e.type==='TileDug'?8:5);i++){
                if(this.items.length===VISUAL.particleLimit)this.items.shift();
                const angle=(s.tick*13+i*47)*.17;
                this.items.push({x:p[0],y:p[1],z:gold?34:10,vx:Math.cos(angle)*22,vy:Math.sin(angle)*22+9,age:0,life:gold?.55:.32,size:gold?1.2:1.5,color,cx:p[0],cy:p[1]});
            }
        }
    }
    step(dt:number):void {
        this.batch.clear();
        for(const p of this.items){p.age+=dt;if(p.age>=p.life)continue;p.x=Math.max(p.cx-13,Math.min(p.cx+13,p.x+p.vx*dt));p.y=Math.max(p.cy-13,Math.min(p.cy+13,p.y+p.vy*dt));p.vy-=45*dt;const size=p.size*(1-p.age/p.life);this.batch.add([p.x,p.y,p.z],[size,size,size],0,p.color);}
        this.items=this.items.filter(p=>p.age<p.life);this.batch.commit();
    }
    get count():number{return this.items.length;}
    dispose():void {this.batch.dispose();}
}
