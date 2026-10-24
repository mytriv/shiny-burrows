import Phaser from 'phaser';
import {GameController} from '../../app/GameController';
import {BrowserInput} from '../../app/BrowserInput';
import {GameAudio} from '../../app/GameAudio';
import {firstBurrow,adventureLevels} from '../../content/levels/first-burrow';
import {boundCamera,cameraConfig,followCamera} from '../../app/camera';
import type {Vec2} from '../../core/model';
import type {WorldRenderer} from '../WorldRenderer';
import {ThreeWorld} from '../three/ThreeWorld';
import {Hud} from '../Hud';

/** Phaser lifecycle/timing only. DOM handles input/UI; Three owns the sole visible canvas. */
export class LevelScene extends Phaser.Scene {
    private controller=new GameController(firstBurrow,adventureLevels);
    private controls:BrowserInput|undefined;
    private world:WorldRenderer|undefined;
    private audio:GameAudio|undefined;
    private hud=new Hud();
    private cameraPosition:Vec2={x:0,y:0};
    private cameraSettings=cameraConfig(520,500,512,864);
    private reduced=false;
    create():void {
        this.game.canvas.remove();
        const parent=document.querySelector<HTMLElement>('#game');if(!parent)throw new Error('Missing game container');
        this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        try{this.world=new ThreeWorld(parent,this.reduced);}catch(error){parent.textContent='This game needs WebGL 2. Enable hardware acceleration or use a WebGL 2 browser.';throw error;}
        this.audio=new GameAudio();
        const layout=()=>{const rect=parent.getBoundingClientRect(),l=this.controller.level;this.world?.resize(Math.floor(rect.width),Math.floor(rect.height));this.cameraSettings=cameraConfig(rect.width,rect.height,l.width*32,l.height*32);this.cameraPosition=boundCamera(this.cameraPosition,this.cameraSettings);};
        const observer=new ResizeObserver(layout);observer.observe(parent);layout();
        const reset=()=>{this.world?.reset(this.controller.state);this.controls?.clear();this.hud.reset();this.cameraPosition={x:0,y:0};layout();};
        this.controls=new BrowserInput(()=>this.controller.pause(),()=>{this.controller.restart();reset();});
        reset();
        const upgrade=()=>{const tier=this.controller.campaign?.pickaxeTier;this.controller.buyUpgrade();if(this.controller.campaign?.pickaxeTier!==tier){this.world?.upgrade();this.audio?.upgrade();}};
        const next=()=>{this.controller.continue();reset();},fresh=()=>{this.controller.newAdventure();reset();};
        const lifetime=new AbortController(),options={signal:lifetime.signal};
        document.querySelector('#upgrade')?.addEventListener('click',upgrade,options);document.querySelector('#next')?.addEventListener('click',next,options);document.querySelector('#new-adventure')?.addEventListener('click',fresh,options);
        const blur=()=>{this.controls?.clear();this.controller.pause(true);};window.addEventListener('blur',blur,options);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();},options);
        // WebGL loss pauses authoritative time rather than silently advancing unseen gameplay.
        this.world.canvas.addEventListener('webglcontextlost',blur,options);
        this.events.once('shutdown',()=>{lifetime.abort();observer.disconnect();this.controls?.destroy();this.audio?.dispose();this.world?.dispose();});
    }
    update(_time:number,delta:number):void {
        if(!this.controls||!this.world)return;
        const input=this.controls.read();this.controller.queue(input);const events=this.controller.advance(delta/1000);
        const s=this.controller.state,old=this.controller.previous,alpha=s.status==='playing'&&!this.controller.paused?this.controller.alpha:1;
        this.world.effects(events,s);this.audio?.events(events);this.hud.events(events,this.time.now);
        const p={x:Phaser.Math.Linear(old.player.position.x,s.player.position.x,alpha),y:Phaser.Math.Linear(old.player.position.y,s.player.position.y,alpha)};
        this.cameraPosition=followCamera(this.cameraPosition,p,s.player.facing,s.player.velocity.y>40,this.cameraSettings,delta/1000,this.reduced);
        this.world.draw({state:s,previous:old,alpha,dt:delta/1000,paused:this.controller.paused,camera:this.cameraPosition,config:this.cameraSettings});this.hud.draw(this.controller,this.time.now);
        const canvas=this.world.canvas,c=this.cameraSettings;
        // Read-only telemetry. No state injection, renderer-driven actions or browser Core API.
        canvas.dataset.input=JSON.stringify(input);canvas.dataset.state=JSON.stringify({...s,level:undefined,tiles:undefined,paused:this.controller.paused});canvas.dataset.campaign=JSON.stringify(this.controller.campaign);
        canvas.dataset.view=JSON.stringify({...this.cameraPosition,zoom:c.zoom,width:c.viewWidth,height:c.viewHeight});canvas.dataset.damage=JSON.stringify(s.tiles.flatMap((t,i)=>t.currentIntegrity!==undefined&&t.currentIntegrity<(t.maxIntegrity??0)?[{index:i,current:t.currentIntegrity,max:t.maxIntegrity}]:[]));
        canvas.setAttribute('aria-label','Shiny Burrows · '+s.level.name+' · '+s.status);
    }
}
