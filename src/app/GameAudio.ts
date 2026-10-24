import type { GameEvent } from '../core/model';
/** Original synthesized feedback. No assets/network, gameplay timers or audio autoplay. */
export class GameAudio {
    private context:AudioContext|undefined;
    private enabled=true;
    private lastTime=-1;
    private lifetime=new AbortController();
    constructor(){
        const unlock=()=>{if(!this.enabled)return;this.context??=new AudioContext();if(this.context.state==='suspended')void this.context.resume();};
        window.addEventListener('pointerdown',unlock,{signal:this.lifetime.signal});window.addEventListener('keydown',unlock,{signal:this.lifetime.signal});
        document.querySelector('#sound')?.addEventListener('click',()=>{this.enabled=!this.enabled;document.querySelector('#sound')?.setAttribute('aria-pressed',String(!this.enabled));const button=document.querySelector('#sound');if(button)button.textContent=this.enabled?'♪':'×♪';},{signal:this.lifetime.signal});
    }
    events(events:readonly GameEvent[]):void {
        const e=events.find(e=>e.type==='TreasureCollected')??events.find(e=>e.type==='TileDug')??events.find(e=>e.type==='TileHit');
        if(e)this.tone(e.type==='TreasureCollected'?750:e.type==='TileDug'?160:240);
    }
    upgrade():void {this.tone(960);}
    private tone(frequency:number):void {
        const c=this.context;if(!this.enabled||!c||c.state!=='running'||c.currentTime-this.lastTime<.045)return;
        this.lastTime=c.currentTime;const oscillator=c.createOscillator(),gain=c.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,c.currentTime);oscillator.frequency.exponentialRampToValueAtTime(frequency*.6,c.currentTime+.08);gain.gain.setValueAtTime(.035,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.1);oscillator.connect(gain);gain.connect(c.destination);oscillator.start();oscillator.stop(c.currentTime+.11);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }
    dispose():void {this.lifetime.abort();if(this.context)void this.context.close();}
}
