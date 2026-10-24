import type {TileKind} from '../../core/model';
/** Presentation-only hash/RNG: no global random state and no simulation mutation. */
export function tileSeed(x:number,y:number,kind:TileKind):number {
    let seed=Math.imul(x+173,73856093)^Math.imul(y+317,19349663);
    for(const code of kind)seed=Math.imul(seed^code.charCodeAt(0),16777619);
    return (seed^(seed>>>16))>>>0;
}
export function seeded(seed:number):()=>number {let n=seed;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
