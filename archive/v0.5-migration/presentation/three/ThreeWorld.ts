import { Scene, OrthographicCamera, WebGLRenderer, HemisphereLight, DirectionalLight, Mesh, Group, SRGBColorSpace, NoToneMapping, Box3, Vector3 } from 'three';
import type { GameState,GameEvent } from '../../core/model';
import type { WorldRenderer,RenderFrame } from '../WorldRenderer';
import { Resources } from './geometry';
import { TerrainView } from './TerrainView';
import { ObjectsView } from './ObjectsView';
import { MoleView } from './MoleView';
import { Particles } from './Particles';
import { molePoint,renderPoint,VISUAL } from './coordinates';

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
    private shadow:Mesh;
    private lastDig=-100;private lastCollect=-100;private lastUpgrade=-100;
    private currentTick=0;
    private frameTimes:number[]=[];
    private lost=false;
    private lifetime=new AbortController();
    constructor(parent:HTMLElement,private reduced:boolean){
        this.gpu=new WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});this.canvas=this.gpu.domElement;
        this.gpu.setPixelRatio(Math.min(window.devicePixelRatio||1,VISUAL.pixelRatioLimit));this.gpu.outputColorSpace=SRGBColorSpace;this.gpu.toneMapping=NoToneMapping;this.gpu.setClearColor('#b8e6dc');
        this.canvas.setAttribute('role','img');parent.append(this.canvas);
        this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;},{signal:this.lifetime.signal});
        this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;},{signal:this.lifetime.signal});
        this.scene.add(new HemisphereLight('#fff4d6','#786d80',2));const light=new DirectionalLight('#fff0cf',2);light.position.set(-150,250,400);this.scene.add(light);
        this.shadow=new Mesh(this.resources.sphere,this.resources.flat('#211e2b',.2));this.shadow.scale.set(9,3,.15);
        this.scene.add(this.background,this.terrain.root,this.objects.root,this.shadow,this.mole.root,this.particles.batch.mesh);
    }
    resize(width:number,height:number):void{this.gpu.setSize(Math.max(1,width),Math.max(1,height),false);}
    reset(s:GameState):void {
        this.lastDig=this.lastCollect=this.lastUpgrade=-100;this.currentTick=s.tick;this.particles.clear();this.frameTimes=[];
        this.background.clear();
        const rect=(x:number,y:number,w:number,h:number,color:string,z:number)=>{const m=new Mesh(this.resources.box,this.resources.matte(color));m.position.set(...renderPoint({x,y},z));m.scale.set(w,h,1);this.background.add(m);};
        const width=s.level.width*32,height=s.level.height*32;
        rect(width/2,height/2,width,height,'#64545a',-18);rect(width/2,64,width,128,'#b8e6dc',-15);
        for(let y=4;y<s.level.height;y+=5)rect(width/2,y*32+80,width,160,y>15?'#60515f':'#716068',-17);
        for(const [x,size] of [[85,110],[330,140],[470,110]]){const hill=new Mesh(this.resources.sphere,this.resources.matte('#89bba0'));hill.position.set(...renderPoint({x:x??0,y:132},-14));hill.scale.set(size??100,35,2);this.background.add(hill);}
        for(const x of [46,108])rect(x,108,5,40,'#ad7d50',-2);rect(77,89,67,7,'#deb678',-2);
        this.terrain.sync(s);this.objects.sync(s,s,1);
    }
    effects(events:readonly GameEvent[],s:GameState):void {
        for(const e of events){if(e.type==='TileHit')this.lastDig=s.tick;if(e.type==='TreasureCollected')this.lastCollect=s.tick;}
        this.particles.emit(events,s,this.reduced);
    }
    upgrade():void {this.lastUpgrade=this.currentTick;}
    draw(f:RenderFrame):void {
        const start=performance.now(),{state:s,previous:old,alpha,config:c}=f;this.currentTick=s.tick;
        this.terrain.sync(s);this.objects.sync(s,old,alpha);
        const p={x:old.player.position.x+(s.player.position.x-old.player.position.x)*alpha,y:old.player.position.y+(s.player.position.y-old.player.position.y)*alpha};
        this.mole.root.position.set(...molePoint(p));this.mole.pose(this.mole.stateAnimation(s,this.lastDig,this.lastCollect,this.lastUpgrade),s.tick,s.player.facing,this.reduced);
        this.shadow.position.set(...renderPoint({x:p.x,y:p.y-1},9));this.shadow.visible=s.player.grounded||s.player.climbing;
        this.camera.left=0;this.camera.right=c.viewWidth;this.camera.top=0;this.camera.bottom=-c.viewHeight;this.camera.position.set(...renderPoint(f.camera,1000));this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
        this.particles.step(f.paused?0:Math.min(f.dt,.05));if(!this.lost)this.gpu.render(this.scene,this.camera);
        this.frameTimes.push(performance.now()-start);if(this.frameTimes.length>180)this.frameTimes.shift();
        const renderBounds=new Box3().setFromObject(this.mole.root),size=renderBounds.getSize(new Vector3());
        this.canvas.dataset.animation=this.mole.animation;
        this.canvas.dataset.render=JSON.stringify({engine:'Three.js r180',projection:'orthographic',cameraRotation:this.camera.rotation.toArray().slice(0,3),tileWidth:32*c.zoom,tileHeight:32*c.zoom,moleWidth:size.x,moleHeight:size.y,moleCenter:p,visualPosition:{x:p.x,y:p.y-13},depth:VISUAL.depth,terrain:this.terrain.counts,particles:this.particles.count,pixelRatio:this.gpu.getPixelRatio(),drawCalls:this.gpu.info.render.calls,triangles:this.gpu.info.render.triangles,geometries:this.gpu.info.memory.geometries,textures:this.gpu.info.memory.textures,renderMs:this.frameTimes.reduce((a,b)=>a+b,0)/this.frameTimes.length,frameMs:f.dt*1000,contextLost:this.lost});
    }
    dispose():void {this.lifetime.abort();this.terrain.dispose();this.objects.dispose();this.particles.dispose();this.resources.dispose();this.gpu.dispose();this.gpu.forceContextLoss();this.canvas.remove();}
}
