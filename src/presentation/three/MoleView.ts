import {Group,Mesh,Box3,Vector3,Matrix4} from 'three';
import type {GameState,DigDirection} from '../../core/model';
import {Resources} from './geometry';
export type MoleAnimation='idle'|'walk'|'climb'|'fall'|'land'|'collect'|'upgrade'|`dig-${DigDirection}`;
export class MoleView {
    readonly root=new Group();private body=new Group();private head=new Group();
    private arms:Group[]=[];private legs:Group[]=[];private pupils:Mesh[]=[];
    animation:MoleAnimation='idle';private age=0;
    constructor(private r:Resources){
        this.root.add(this.body);this.body.add(this.head);this.head.scale.set(1.08,1.05,1);
        this.ball(this.body,'#8e4331',[0,-2.5,-1],[8.6,7,5.3]);this.ball(this.body,'#e9b86c',[0,-3.5,3],[5.6,4.7,2]);
        this.ball(this.head,'#ae6541',[0,0,0],[7.1,7.8,5.6]);
        for(const sign of [-1,1]){
            this.ball(this.head,'#73422e',[sign*5.6,5.5,-.3],[2.1,2.2,1.7]);this.ball(this.head,'#d89a87',[sign*5.7,5.6,1],[1.15,1.3,.6]);
            this.ball(this.head,'#fff8df',[sign*2.8,1.8,5.3],[2.65,2.9,1.5]);
            this.ball(this.head,'#4c9fcd',[sign*2.7,1.5,6.4],[1.65,2.1,.7]);
            this.pupils.push(this.ball(this.head,'#261f2b',[sign*2.7,1.5,6.7],[1.25,1.7,.8]));this.ball(this.head,'#ffffff',[sign*2.7-.4,2.3,7.2],[.42,.55,.22]);
            for(const y of [-.8,1]){const w=new Mesh(r.box,r.matte('#f9cfa8'));w.position.set(sign*7.1,-1+y,6.4);w.scale.set(3.4,.27,.3);w.rotation.z=sign*y*.2;this.head.add(w);}
            const hip=new Group();this.body.add(hip);this.legs.push(hip);
            this.ball(hip,'#69402e',[0,-1.3,0],[1.6,2.2,1.6]);this.ball(hip,'#734631',[0,-4.1,1.3],[2.4,1.55,3]);
            this.ball(hip,'#e9b490',[0,-4.3,3.4],[1.8,.6,1]);
            const shoulder=new Group();this.body.add(shoulder);this.arms.push(shoulder);
            this.ball(shoulder,'#895330',[0,-1,0],[1.6,2,1.8]);this.ball(shoulder,'#dfb58a',[0,-2.2,1],[1.7,1.6,1.8]);
            for(const x of [-.95,0,.95]){const claw=new Mesh(r.claw,r.matte('#fff0c5'));claw.scale.set(.9,1.05,.9);claw.position.set(x,-3.8,2);claw.rotation.z=Math.PI;shoulder.add(claw);}
        }
        this.ball(this.head,'#d1a16f',[0,-1,5.5],[3,2.1,1.8]);this.ball(this.head,'#ed889a',[0,-.7,7.2],[2.6,1.65,1.8]);this.ball(this.head,'#ffd2c9',[-.6,-.2,8.5],[.7,.4,.2]);
        this.ball(this.head,'#d98b2c',[0,6.2,0],[8,.65,6.2]);this.ball(this.head,'#ffb12d',[0,6.6,0],[7,1.9,5.5]);
        this.ball(this.head,'#9c642c',[0,7.1,5.2],[1.7,1.6,.8]);this.ball(this.head,'#fff0a1',[0,7.1,5.9],[1.15,1.1,.5]);
        for(const sign of [-1,1])this.ball(this.head,'#e8987c',[sign*4.2,-1.4,5.8],[1.5,.8,.4]);
        this.ball(this.head,'#5d2928',[0,-3.1,6],[1.65,.8,.6]);this.ball(this.head,'#fff2d1',[0,-2.8,6.5],[.8,.35,.3]);
        this.pose('idle',0,1,false);
    }
    private ball(parent:Group,color:string,p:readonly[number,number,number],scale:readonly[number,number,number]):Mesh {
        const m=new Mesh(this.r.sphere,this.r.matte(color));m.position.set(...p);m.scale.set(...scale);parent.add(m);return m;
    }
    pose(animation:MoleAnimation,tick:number,facing:number,reduced:boolean,strikeAge=tick%24):void {
        this.animation=animation;this.age=strikeAge;
        const phase=reduced?0:tick*.4,swing=Math.sin(phase),walking=animation==='walk',climbing=animation==='climb',digging=animation.startsWith('dig-');
        const impact=strikeAge<3?1-strikeAge/4:0,recoil=strikeAge>=3&&strikeAge<9?Math.sin((strikeAge-3)/6*Math.PI):0,prepare=strikeAge>=14?Math.sin((strikeAge-14)/10*Math.PI/2):0;
        const dir=animation==='dig-left'?-1:animation==='dig-right'?1:0;
        this.body.scale.set(.85,animation==='land'?.93:walking?1.04:animation==='idle'?1.04+(!reduced?Math.sin(tick*.07)*.008:0):.97,1);
        this.body.position.set(digging?-dir*recoil*.45:0,walking?Math.abs(swing)*.65:0,0);
        this.body.rotation.set(0,facing*.25,walking?facing*swing*.035:digging?dir*(prepare*.05-impact*.045):0);
        this.head.position.set(walking?-facing*swing*.25:0,3.1+(walking?Math.cos(phase*2)*.2:0),1);
        this.head.rotation.z=walking?-swing*.025:digging?-dir*prepare*.04:0;
        this.head.rotation.y=facing*.35;
        this.pupils.forEach((p,i)=>p.position.x=(i===0?-2.7:2.7)+facing*.35);
        this.legs.forEach((leg,i)=>{const sign=i===0?-1:1;leg.position.set(sign*3.6,-6.4+(walking?Math.max(0,sign*swing)*1.1:climbing?sign*swing:0),.4);leg.rotation.set(0,0,walking?facing*sign*swing*.38:0);});
        this.arms.forEach((arm,i)=>{
            const sign=i===0?-1:1;let x=sign*5.3,y=-.6,angle=walking?-facing*sign*swing*.6:sign*.16;
            if(animation==='dig-up'){x=sign*3.9;y=7.3+impact*1.8-prepare*5.5;angle=Math.PI+sign*(recoil*.5+prepare*1.15);}
            else if(animation==='dig-down'){x=sign*4.5;y=-5.3-impact*.8+prepare*5.5;angle=sign*(recoil*.55+prepare*.9);}
            else if(dir){const active=dir===sign;x=sign*(active?4.8:5.2);y=active?.3+prepare*1.3:-1;angle=active?dir*(Math.PI/2+impact*.12-recoil*.75-prepare*1.2):sign*.3;}
            else if(climbing){y=sign*swing*2;angle=sign*swing*.6;}
            else if(animation==='fall'){y=1.5;angle=sign*-.8;}
            else if(animation==='collect'||animation==='upgrade'){x=sign*4.3;y=4;angle=Math.PI+sign*.3;}
            arm.position.set(x,y,digging?8:3);arm.rotation.z=angle;
        });
        this.root.updateWorldMatrix(true,true);
    }
    sample():Readonly<{bodyY:number;bodyAngle:number;headY:number;arms:number[];legs:number[];strikeAge:number}> {
        return {bodyY:this.body.position.y,bodyAngle:this.body.rotation.z,headY:this.head.position.y,arms:this.arms.map(a=>a.rotation.z),legs:this.legs.map(l=>l.rotation.z),strikeAge:this.age};
    }
    bounds():{width:number;height:number;depth:number} {
        this.root.updateWorldMatrix(true,true);const inverse=this.root.matrixWorld.clone().invert(),b=new Box3();
        this.body.traverse(object=>{if(object instanceof Mesh){if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();const bounds=object.geometry.boundingBox;if(bounds)b.union(bounds.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse,object.matrixWorld)));}});
        const size=b.getSize(new Vector3());return {width:size.x,height:size.y,depth:size.z};
    }
    stateAnimation(s:GameState,lastDig:number,lastCollect:number,lastUpgrade:number,lastLand=-100,lastDirection:DigDirection='right'):MoleAnimation {
        if(s.tick-lastDig<10)return `dig-${lastDirection}`;
        if(s.tick-lastDig<24&&s.miningContact)return `dig-${s.miningContact.direction}`;
        if(s.tick-lastUpgrade<36)return 'upgrade';if(s.tick-lastCollect<22)return 'collect';
        if(s.player.climbing&&Math.abs(s.player.velocity.y)>1)return 'climb';if(Math.abs(s.player.velocity.x)>1)return 'walk';
        if(s.player.velocity.y>40)return 'fall';return s.tick-lastLand<8?'land':'idle';
    }
}






