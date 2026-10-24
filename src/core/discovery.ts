import type {GameState} from './model';
import {playerBox} from './world';
import {TILE_SIZE} from './constants';

export function isDiscovered(s:Pick<GameState,'discovered'|'level'>,index:number):boolean {
    return Number.isInteger(index)&&index>=0&&index<s.level.width*s.level.height&&!!((s.discovered[index>>>5]??0)&(1<<(index&31)));
}
function bodyCells(s:GameState):readonly number[] {
    const b=playerBox(s.player.position),result:number[]=[];
    for(let y=Math.floor(b.top/TILE_SIZE);y<=Math.floor((b.bottom-1e-7)/TILE_SIZE);y++)
        for(let x=Math.floor(b.left/TILE_SIZE);x<=Math.floor((b.right-1e-7)/TILE_SIZE);x++)
            if(x>=0&&x<s.level.width&&y>=0&&y<s.level.height)result.push(y*s.level.width+x);
    return result;
}
/** Two cardinal open-cell steps; expose the first solid face, never see through it. */
export function discover(s:GameState,previous?:GameState):GameState {
    const seeds=bodyCells(s);
    if(previous&&s.tiles===previous.tiles&&seeds.join(',')===bodyCells(previous).join(','))return s;
    let words:number[]|undefined;
    const reveal=(i:number)=>{if(!isDiscovered(s,i)){words??=s.discovered.slice();words[i>>>5]=((words[i>>>5]??0)|(1<<(i&31)))>>>0;}};
    const seen=new Set(seeds),queue=seeds.map(i=>({i,d:0})),w=s.level.width,h=s.level.height;
    for(let q=0;q<queue.length;q++){
        const current=queue[q];if(!current)continue;const {i,d}=current;reveal(i);
        if(d===2)continue;
        const x=i%w,y=Math.floor(i/w);
        for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
            if(nx===undefined||ny===undefined||nx<0||nx>=w||ny<0||ny>=h)continue;
            const next=ny*w+nx;if(seen.has(next))continue;seen.add(next);reveal(next);
            if(s.tiles[next]?.kind==='empty')queue.push({i:next,d:d+1});
        }
    }
    return words?{...s,discovered:words}:s;
}
