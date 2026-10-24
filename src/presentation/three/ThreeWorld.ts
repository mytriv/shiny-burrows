import { Scene, OrthographicCamera, WebGLRenderer, HemisphereLight, DirectionalLight, Mesh, Group, SRGBColorSpace, NoToneMapping } from 'three';
import type { GameState,GameEvent,DigDirection } from '../../core/model';
import type { WorldRenderer,RenderFrame } from '../WorldRenderer';
import { Resources } from './geometry';
import { TerrainView } from './TerrainView';
import { ObjectsView } from './ObjectsView';
import { MoleView } from './MoleView';
import { Particles } from './Particles';
import {playerPose} from '../../app/playerPose';
import { elevatedCamera,placeCharacter,renderPoint,VISUAL,SIN } from './coordinates';

export class ThreeWorld implements WorldRenderer {
    readonly canvas:HTMLCanvasElement;
    private readonly scene=new Scene();
    private readonly camera=new OrthographicCamera(0,520,0,-500,.1,2000);
    private readonly gpu:WebGLRenderer;
    private readonly resources=new Resources();
    private readonly terrain=new TerrainView(this.resources);
    private readonly objects=new ObjectsView(this.resources);
    private readonly mole=new MoleView(this.resources);
    private readonly particles=new Particles(this.resources);
    private background=new Group();
    private world=new Group();
    private shadow:Mesh;
    private lastDig=-100;private lastCollect=-100;private lastUpgrade=-100;private lastLand=-100;
    private currentTick=0;
    private lastDirection:DigDirection='right';
    private frameTimes:number[]=[];
    private lost=false;
    private lifetime=new AbortController();
    constructor(parent:HTMLElement,private reduced:boolean){
        this.gpu=new WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});this.canvas=this.gpu.domElement;
        this.gpu.setPixelRatio(Math.min(window.devicePixelRatio||1,VISUAL.pixelRatioLimit));this.gpu.outputColorSpace=SRGBColorSpace;this.gpu.toneMapping=NoToneMapping;this.gpu.setClearColor('#241014');
        this.canvas.setAttribute('role','img');parent.append(this.canvas);
        this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;},{signal:this.lifetime.signal});
        this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;},{signal:this.lifetime.signal});
        this.scene.add(new HemisphereLight('#ffe9c9','#5b3a50',1.1));const light=new DirectionalLight('#ffe3b3',2.5);light.position.set(-150,300,350);this.scene.add(light);const fill=new DirectionalLight('#d6c1ff',.35);fill.position.set(220,30,150);this.scene.add(fill);
        this.shadow=new Mesh(this.resources.sphere,this.resources.flat('#211e2b',.2));this.shadow.scale.set(9,3,.15);
        this.world.add(this.background,this.terrain.root,this.objects.root,this.shadow,this.mole.root,this.particles.batch.mesh);this.scene.add(this.world);
    }
    resize(width:number,height:number):void{this.gpu.setPixelRatio(Math.min(window.devicePixelRatio||1,VISUAL.pixelRatioLimit,Math.sqrt(400000/Math.max(1,width*height))));this.gpu.setSize(Math.max(1,width),Math.max(1,height),false);}
    reset(s:GameState):void {
        this.lastDig=this.lastCollect=this.lastUpgrade=this.lastLand=-100;this.currentTick=s.tick;this.particles.clear();this.objects.reset();this.frameTimes=[];
        this.background.clear();
        const rect=(x:number,y:number,w:number,h:number,color:string,z:number)=>{const m=new Mesh(this.resources.box,this.resources.matte(color));m.position.set(...renderPoint({x,y},z));m.scale.set(w,h,1);this.background.add(m);};
        const width=s.level.width*32,height=s.level.height*32;
        rect(width/2,height/2,width,height,'#281317',-VISUAL.depth-7);
        this.terrain.sync(s);this.objects.sync(s,s,1);
    }
    effects(events:readonly GameEvent[],s:GameState):void {
        for(const e of events){if(e.type==='TileHit'){this.lastDig=s.tick;this.lastDirection=s.miningContact?.direction??(e.cell.y*32>=s.player.position.y-.1?'down':(e.cell.y+1)*32<=s.player.position.y-18?'up':e.cell.x*32<s.player.position.x?'left':'right');}if(e.type==='TreasureCollected')this.lastCollect=s.tick;if(e.type==='Landed')this.lastLand=s.tick;}
        this.objects.effects(events,s);this.particles.emit(events,s,this.reduced);
    }
    upgrade():void {this.lastUpgrade=this.currentTick;}
    draw(f:RenderFrame):void {
        const start=performance.now(),{state:s,previous:old,alpha,config:c}=f;this.currentTick=s.tick;
        const terrainStart=performance.now();this.terrain.sync(s);const terrainMs=performance.now()-terrainStart;this.objects.sync(s,old,alpha,this.reduced);
        const p=playerPose(s,alpha);
        elevatedCamera(this.world,this.camera,f.camera,c);
        const mode=this.mole.stateAnimation(s,this.lastDig,this.lastCollect,this.lastUpgrade,this.lastLand,this.lastDirection),surfaceLift=s.player.grounded?VISUAL.depth/2*SIN:0, lift=s.player.grounded?surfaceLift-1.3:0;placeCharacter(this.mole.root,p,lift);this.mole.pose(mode,s.tick,s.player.facing,this.reduced,s.tick-this.lastDig);
        this.shadow.position.set(...renderPoint({x:p.x,y:p.y-surfaceLift-9*SIN},9));this.shadow.visible=s.player.grounded||s.player.climbing;
        this.particles.step(f.paused?0:Math.min(f.dt,.05));if(!this.lost)this.gpu.render(this.scene,this.camera);
        this.frameTimes.push(performance.now()-start);if(this.frameTimes.length>180)this.frameTimes.shift();
        const size=this.mole.bounds();
        this.canvas.dataset.terrainMs=String(terrainMs);this.canvas.dataset.animation=this.mole.animation;
        this.canvas.dataset.pose=JSON.stringify(this.mole.sample());
        this.canvas.dataset.render=JSON.stringify({engine:'Three.js r180',projection:'orthographic',cameraRotation:this.camera.rotation.toArray().slice(0,3),tileWidth:32*c.zoom,tileHeight:32*c.zoom,moleWidth:size.width,moleHeight:size.height,moleCenter:p,visualPosition:{x:p.x,y:p.y-13-lift},depth:VISUAL.depth,topSurfacePixels:VISUAL.depth*SIN*c.zoom,terrain:this.terrain.counts,particles:this.particles.count,pixelRatio:this.gpu.getPixelRatio(),drawCalls:this.gpu.info.render.calls,triangles:this.gpu.info.render.triangles,geometries:this.gpu.info.memory.geometries,textures:this.gpu.info.memory.textures,renderMs:this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length,frameMs:f.dt*1000,contextLost:this.lost});
    }
    dispose():void {this.lifetime.abort();this.terrain.dispose();this.objects.dispose();this.particles.dispose();this.resources.dispose();this.gpu.dispose();this.gpu.forceContextLoss();this.canvas.remove();}
}



