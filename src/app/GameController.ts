import { newCampaign, startLevel, finishLevel, nextLevel, upgrade, type Campaign } from '../core/campaign';
import { DT } from '../core/constants';
import { createState } from '../core/levels';
import { IDLE, type GameEvent, type GameState, type InputIntent, type LevelDefinition } from '../core/model';
import { stepGame } from '../core/simulation';
export class GameController {
    state: GameState;
    previous: GameState;
    paused = false;
    private accumulator = 0;
    private pending = IDLE;
    campaign: Campaign | undefined;
    private entryWallet: number;
    private entryPower = 1;
    constructor(public level: LevelDefinition, private levels?: readonly LevelDefinition[]) { this.entryWallet = level.startWallet; if (levels) {
        this.campaign = newCampaign();
        this.state = startLevel(this.campaign, levels);
    }
    else
        this.state = createState(level); this.previous = this.state; }
    buyUpgrade(): void { if (this.campaign)
        this.campaign = upgrade(this.campaign); }
    continue(): void { if (!this.campaign || !this.levels || this.campaign.phase !== 'surface')
        return; this.campaign = nextLevel(this.campaign); this.state = startLevel(this.campaign, this.levels); this.level = this.state.level; this.entryWallet = this.state.wallet; this.entryPower = this.state.pickaxePower; this.resetClock(); }
    newAdventure(): void { if (!this.levels)
        return; this.campaign = newCampaign(); this.state = startLevel(this.campaign, this.levels); this.level = this.state.level; this.entryWallet = 0; this.entryPower = 1; this.resetClock(); }
    private resetClock(): void { this.previous = this.state; this.accumulator = 0; this.pending = IDLE; this.paused = false; }
    get alpha(): number { return this.accumulator / DT; }
    queue(input: InputIntent): void { this.pending = { ...input, downPressed: !!input.downPressed || !!this.pending.downPressed, placePlatformPressed: !!input.placePlatformPressed || !!this.pending.placePlatformPressed, buyPlatformPressed: !!input.buyPlatformPressed || !!this.pending.buyPlatformPressed }; }
    pause(value = !this.paused): void { this.paused = value; this.state = { ...this.state, miningContact: null, traversal:this.state.traversal?{...this.state.traversal,dropRequested:false}:null }; this.accumulator = 0; this.pending = IDLE; this.previous = this.state; }
    restart(): void { if (this.campaign && this.campaign.phase !== 'playing')
        return; this.state = createState(this.level, this.entryWallet, this.entryPower); this.resetClock(); }
    advance(elapsedSeconds: number): readonly GameEvent[] {
        if (this.paused || this.state.status !== 'playing') {
            this.accumulator = 0;
            return [];
        }
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0)
            return [];
        this.accumulator = Math.min(this.accumulator + elapsedSeconds, DT * 5);
        const events: GameEvent[] = [];
        while (this.accumulator + 1e-10 >= DT) {
            this.previous = this.state;
            const r = stepGame(this.state, this.pending);
            this.state = r.state;
            if (this.campaign && this.levels)
                this.campaign = finishLevel(this.campaign, this.state, this.levels);
            events.push(...r.events);
            this.pending = { ...this.pending, downPressed: false, placePlatformPressed: false, buyPlatformPressed: false };
            this.accumulator = Math.max(0, this.accumulator - DT);
        }
        return events;
    }
}
