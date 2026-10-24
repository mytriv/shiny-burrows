// QA-only worst-case discovery profile. Not imported by or shipped with the game.
import {ThreeWorld} from '../../src/presentation/three/ThreeWorld';
import {cameraConfig} from '../../src/app/camera';
import {firstBurrow} from '../../src/content/levels/first-burrow';
import {createState} from '../../src/core/levels';
import {revealAll} from './discovery';
const parent=document.querySelector<HTMLElement>('#game');if(!parent)throw new Error('Missing profile host');
const world=new ThreeWorld(parent,false),state=revealAll(createState(firstBurrow));world.reset(state);
let config=cameraConfig(520,500,512,864);
const resize=()=>{const rect=parent.getBoundingClientRect();world.resize(Math.floor(rect.width),Math.floor(rect.height));config=cameraConfig(rect.width,rect.height,512,864);};
new ResizeObserver(resize).observe(parent);resize();
let previous=performance.now();function draw(now:number){world.draw({state,previous:state,alpha:1,dt:(now-previous)/1000,paused:true,camera:{x:0,y:0},config});previous=now;requestAnimationFrame(draw);}requestAnimationFrame(draw);
