import type {GameState} from './model';
import {isDiscovered} from './discovery';
export type DepositTier='small'|'medium'|'rich'|'rare';
/** Value is authored gameplay data; size is presentation of that finite reward. */
export function depositTier(value:number):DepositTier {return value<=10?'small':value<=18?'medium':value<=28?'rich':'rare';}
export const DEPOSIT_NUGGETS:Readonly<Record<DepositTier,number>>={small:2,medium:3,rich:5,rare:7};
export function goldHintAt(s:GameState,index:number):boolean {
    return !!s.level.goldHints?.some(h=>h.cell.y*s.level.width+h.cell.x===index&&s.level.tiles.some((t,i)=>t.lootId===h.depositId&&!isDiscovered(s,i)&&!s.collectedLootIds.includes(h.depositId)));
}
