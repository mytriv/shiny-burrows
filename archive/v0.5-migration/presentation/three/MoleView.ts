import { Group, Mesh, Box3, Vector3 } from 'three';
import type { GameState, DigDirection } from '../../core/model';
import { Resources } from './geometry';
export type MoleAnimation='idle'|'walk'|'climb'|'fall'|'collect'|'upgrade'|`dig-${DigDirection}`;
/** Entire model, including animated claws, stays inside the 20×26 collider envelope. */
export class MoleView {
    readonly root=new Group();
    private body=new Group();
    private hands:Group[]=[];
    private feet:Mesh[]=[];
    private pupils:Mesh[]=[];
    animation:MoleAnimation='idle';
    constructor(private r:Resources){
        this.root.add(this.body);
        this.ball(this.body,'#835539',[0,-1,-1],[7.5,9,5.5]);
        this.ball(this.body,'#b58157',[0,3,1],[7,8,5.5]);
        this.ball(this.body,'#d3a273',[0,-3,4],[5,5.5,2]);
        for(const sign of [-1,1]){
            this.ball(this.body,'#805335',[sign*5.7,8.2,0],[2,2.3,1.7]);
            this.ball(this.body,'#d9a083',[sign*5.8,8.3,1.3],[1.1,1.3,.5]);
            this.ball(this.body,'#fff4d7',[sign*2.9,4.7,6.0],[2.25,2.75,1.3]);
            this.pupils.push(this.ball(this.body,'#302e3d',[sign*2.7,4.4,7.2],[1.15,1.65,.7]));
            this.ball(this.body,'#ffffff',[sign*2.7-.35,5.2,7.7],[.4,.55,.2]);
            this.feet.push(this.ball(this.body,'#62432f',[sign*3.8,-10.5,1],[2.6,1.9,3.2]));
            this.ball(this.body,'#edb494',[sign*4,-10.7,3.1],[1.8,.75,1.1]);
            const hand=new Group();this.body.add(hand);this.hands.push(hand);
            this.ball(hand,'#a16f49',[0,0,0],[2,2.1,2.2]);
            for(const x of [-1,0,1]){const claw=new Mesh(r.claw,r.matte('#fff1ce'));claw.position.set(x,-2,1.3);claw.rotation.z=Math.PI;hand.add(claw);}
            for(const y of [-.8,1.1]){const whisker=new Mesh(r.box,r.matte('#ffe1b9'));whisker.position.set(sign*7,1.2+y,6.7);whisker.scale.set(4,.3,.3);whisker.rotation.z=sign*y*.14;this.body.add(whisker);}
        }
        this.ball(this.body,'#ee949e',[0,1.6,7.2],[2.6,1.65,1.7]);
        this.ball(this.body,'#ffd0cb',[-.6,2.1,8.5],[.7,.4,.2]);
        this.pose('idle',0,1,false);
    }
    private ball(parent:Group,color:string,p:readonly[number,number,number],scale:readonly[number,number,number]):Mesh {
        const m=new Mesh(this.r.sphere,this.r.matte(color));m.position.set(...p);m.scale.set(...scale);parent.add(m);return m;
    }
    pose(animation:MoleAnimation,tick:number,facing:number,reduced:boolean):void {
        this.animation=animation;const phase=reduced?0:tick*.45,swing=Math.sin(phase);
        const walking=animation==='walk'||animation==='climb';
        this.body.scale.set(1,walking? .98+.02*Math.abs(swing):1,1);
        this.pupils.forEach((p,i)=>p.position.x=(i===0?-2.7:2.7)+facing*.3);
        this.feet.forEach((f,i)=>{f.position.y=-10.5+(walking?(i===0?swing:-swing)*.6:0);});
        this.hands.forEach((hand,i)=>{
            const sign=i===0?-1:1;let x=sign*6.7,y=-2,angle=sign*.18;
            if(animation==='dig-up'){x=sign*4.7;y=6.6+(reduced?0:swing*.6);angle=Math.PI;}
            else if(animation==='dig-down'){x=sign*5.3;y=-7.3+(reduced?0:swing*.5);angle=0;}
            else if(animation==='dig-left'||animation==='dig-right'){const dir=animation==='dig-left'?-1:1;x=dir===sign?sign*7.4:sign*5.9;y=dir===sign?1+swing:0;angle=dir===sign?dir*Math.PI/2:0;}
            else if(animation==='climb'){y=sign*swing*3;}
            else if(animation==='fall'){x=sign*6.9;y=1.7;angle=sign*-.6;}
            else if(animation==='collect'||animation==='upgrade'){y=4.5+(reduced?0:swing);angle=Math.PI;}
            hand.position.set(x,y,3.8);hand.rotation.z=angle;
        });
        this.root.updateMatrixWorld(true);
    }
    /** Model-local XY dimensions; diagnostic only, never used for gameplay collision. */
    bounds():{width:number;height:number;depth:number} {
        this.body.updateWorldMatrix(true,true);const b=new Box3().setFromObject(this.body),size=b.getSize(new Vector3());return {width:size.x,height:size.y,depth:size.z};
    }
    stateAnimation(s:GameState,lastDig:number,lastCollect:number,lastUpgrade:number):MoleAnimation {
        if(s.tick-lastDig<12 && s.miningContact)return `dig-${s.miningContact.direction}`;
        if(s.tick-lastUpgrade<36)return 'upgrade';if(s.tick-lastCollect<22)return 'collect';
        if(s.player.climbing&&Math.abs(s.player.velocity.y)>1)return 'climb';
        if(Math.abs(s.player.velocity.x)>1)return 'walk';return s.player.velocity.y>40?'fall':'idle';
    }
}
