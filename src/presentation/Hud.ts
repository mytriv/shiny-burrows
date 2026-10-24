import type {GameController} from '../app/GameController';
import type {GameEvent} from '../core/model';
import {ladderAt} from '../core/ladders';
import {platformSupports,validatePlatform} from '../core/platforms';
import {BALANCE} from '../core/config';
export class Hud {
    private feedbackUntil=0;
    private text(selector:string,value:string):void{const el=document.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;}
    reset():void{this.feedbackUntil=0;}
    events(events:readonly GameEvent[],now:number):void {
        for(const e of events){
            const message=e.type==='TreasureCollected'?'+'+e.value+' gold!':e.type==='SolidBlocked'?'Solid rock · Choose another direction':e.type==='PlatformBought'?'One platform ready to place.':e.type==='PlatformPlaced'?'Platform built. Press Down to drop through.':e.type==='BoulderReleased'?'Loose rock — step aside!':e.type==='QuotaReached'?'Gold goal reached! Find the green exit.':null;
            if(message){this.text('#feedback',message);this.feedbackUntil=now+2200;}
        }
    }
    draw(controller:GameController,now:number):void {
        const s=controller.state,campaign=controller.campaign,playing=s.status==='playing'&&!controller.paused;
        this.text('#stats','◆ '+s.levelGoldCollected+'/'+s.level.treasureQuota+' gold   ● '+s.wallet+' coins   ✦ Claws '+s.pickaxePower+'   ▰ '+s.inventory.platforms+'   ↓ '+(s.level.depth+Math.max(0,Math.floor(s.player.position.y/32)-4))+'m');
        this.text('#level-name',s.level.name);this.text('#wallet',String(s.wallet));this.text('#power',String(s.pickaxePower));this.text('#inventory',String(s.inventory.platforms));
        const depth=s.level.depth+Math.max(0,Math.floor(s.player.position.y/32)-4);const depthElement=document.querySelector<HTMLElement>('#depth');if(depthElement&&depthElement.dataset.value!==String(depth)){depthElement.innerHTML=depth+'<span>m</span>';depthElement.dataset.value=String(depth);}
        this.text('#goal-label',s.levelGoldCollected+' / '+s.level.treasureQuota);const progress=document.querySelector<HTMLProgressElement>('#goal');if(progress){if(progress.max!==s.level.treasureQuota)progress.max=s.level.treasureQuota;if(progress.value!==s.levelGoldCollected)progress.value=s.levelGoldCollected;}
        const disabled=(action:string,value:boolean)=>{const b=document.querySelector<HTMLButtonElement>('[data-action="'+action+'"]');if(b&&b.disabled!==value)b.disabled=value;};
        const ladder=ladderAt(s);disabled('up',!playing);disabled('down',!playing||(!ladder&&!s.player.grounded));disabled('platform',!playing||validatePlatform(s)!==null);disabled('buy',!playing||s.wallet<BALANCE.platformPrice);
        if(controller.paused)this.text('#feedback','Paused · Pause or Esc to resume');
        else if(s.status==='failed')this.text('#feedback','Try another route · Restart');
        else if(now>=this.feedbackUntil)this.text('#feedback',s.levelGoldCollected>=s.level.treasureQuota?'Gold goal reached · Green exit below':s.platforms.some(p=>platformSupports(s,p))?'Down to drop through':'');
        const station=document.querySelector<HTMLElement>('#station');if(station)station.hidden=!campaign||campaign.phase==='playing';
        if(campaign){
            this.text('#station-stats','Coins '+campaign.wallet+' · Claw power '+(campaign.pickaxeTier+1)+' · Mines complete '+campaign.completed.length+'/3');
            const cost=BALANCE.upgradePrices[campaign.pickaxeTier],b=document.querySelector<HTMLButtonElement>('#upgrade');
            if(b){b.textContent=cost===undefined?'Claws fully upgraded':'Claw power '+(campaign.pickaxeTier+2)+' — '+cost+' coins';b.disabled=campaign.phase!=='surface'||cost===undefined||campaign.wallet<cost;}
            this.text('#station-title',campaign.phase==='finished'?'Three lovely burrows complete!':'Surface workshop');
        }
        const next=document.querySelector<HTMLButtonElement>('#next');if(next)next.hidden=campaign?.phase!=='surface';
    }
}
