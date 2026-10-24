// QA-only scene: production renderer and unmodified Core; never included in the game build.
import {ThreeWorld} from '../../src/presentation/three/ThreeWorld';
import {cameraConfig} from '../../src/app/camera';
import {createState} from '../../src/core/levels';
import {stepGame} from '../../src/core/simulation';
import {IDLE,type LevelDefinition,type Tile} from '../../src/core/model';
import {revealAll} from './discovery';
const width=10,height=8,tiles:Tile[]=Array.from({length:width*height},(_,i)=>({kind:i%width===0||i%width===width-1||Math.floor(i/width)===height-1?'bedrock':'empty'}));
tiles[6*width+2]={kind:'ore_soil',oreStratum:'soil',lootId:'qa-gold',lootValue:5};tiles[5*width+3]={kind:'soil'};tiles[6*width+6]={kind:'stone'};
const level:LevelDefinition={id:'qa-visual',name:'Visual fixture',depth:0,width,height,tiles,spawn:{x:48,y:224},killY:256,startWallet:0,treasureQuota:5,overlays:[],boulders:[{id:'qa-round-rock',cell:{x:5,y:2}}]};
const parent=document.querySelector<HTMLElement>('#game');if(!parent)throw new Error('Missing fixture host');
const world=new ThreeWorld(parent,false);world.resize(800,640);let state=revealAll(createState(level)),previous=state;world.reset(state);
const config=cameraConfig(800,640,width*32,height*32);
function draw(){world.draw({state,previous,alpha:1,dt:1/60,paused:false,camera:{x:0,y:0},config});world.canvas.dataset.rock=JSON.stringify(state.boulders[0]);}
function advance(until:'warning'|'falling'|'impact'|'rest'){
 for(let i=0;i<(until==='rest'?15:200);i++){previous=state;const result=stepGame(state,IDLE);state=result.state;world.effects(result.events,state);draw();const rock=state.boulders[0];if(until==='warning'&&(rock?.warningTicks??0)>0)break;if(until==='falling'&&(rock?.velocityY??0)>120)break;if(until==='impact'&&result.events.some(e=>e.type==='BoulderImpact'))break;}
}
for(const id of ['warning','falling','impact','rest'] as const)document.getElementById(id)?.addEventListener('click',()=>advance(id));draw();
