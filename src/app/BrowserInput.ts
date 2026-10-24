import type { InputIntent } from '../core/model';
export class BrowserInput {
    private lifetime = new AbortController();
    private keys = new Set<string>();
    private pointers = new Map<number, string>();
    private down = false;
    private place = false;
    private buy = false;
    constructor(onPause: () => void, onRestart: () => void) {
        const options = { signal: this.lifetime.signal };
        window.addEventListener('keydown', e => {
            const code = e.code;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code)) e.preventDefault();
            // Held state comes from the original physical press, never OS key repeat.
            if (e.repeat || this.keys.has(code)) return;
            this.keys.add(code);
            if (code === 'KeyS' || code === 'ArrowDown') this.down = true;
            if (code === 'KeyE') this.place = true;
            if (code === 'KeyB') this.buy = true;
            if (code === 'Escape') { this.clear(); onPause(); }
            if (code === 'KeyR') { this.clear(); onRestart(); }
        }, options);
        window.addEventListener('keyup', e => this.keys.delete(e.code), options);
        window.addEventListener('blur', () => this.clear(), options);
        document.addEventListener('visibilitychange', () => this.clear(), options);
        document.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach(button => {
            const action = button.dataset.action;
            if (!action) return;
            button.addEventListener('contextmenu', e => e.preventDefault(), options);
            button.addEventListener('pointerdown', e => {
                if (button.disabled) return;
                e.preventDefault(); button.setPointerCapture(e.pointerId);
                this.pointers.set(e.pointerId, action); button.classList.add('held');
                if (action === 'down') this.down = true;
                if (action === 'platform') this.place = true;
                if (action === 'buy') this.buy = true;
            }, options);
            const release = (e: PointerEvent) => {
                this.pointers.delete(e.pointerId);
                if (![...this.pointers.values()].includes(action)) button.classList.remove('held');
            };
            button.addEventListener('pointerup', release, options);
            button.addEventListener('pointercancel', release, options);
            button.addEventListener('lostpointercapture', release, options);
        });
        document.querySelector('#pause')?.addEventListener('click', () => { this.clear(); onPause(); }, options);
        document.querySelector('#restart')?.addEventListener('click', () => { this.clear(); onRestart(); }, options);
    }
    destroy(): void { this.clear(); this.lifetime.abort(); }
    clear(): void {
        this.keys.clear(); this.pointers.clear(); this.down = this.place = this.buy = false;
        document.querySelectorAll('.held').forEach(e => e.classList.remove('held'));
    }
    read(): InputIntent {
        const held = new Set(this.pointers.values());
        const key = (...codes: string[]) => codes.some(code => this.keys.has(code));
        const left = key('KeyA', 'ArrowLeft') || held.has('left');
        const right = key('KeyD', 'ArrowRight') || held.has('right');
        const up = key('KeyW', 'ArrowUp') || held.has('up');
        const down = key('KeyS', 'ArrowDown') || held.has('down');
        const result: InputIntent = {
            moveX: left === right ? 0 : left ? -1 : 1,
            climbY: up === down ? 0 : up ? -1 : 1,
            downPressed: this.down, placePlatformPressed: this.place, buyPlatformPressed: this.buy,
        };
        this.down = this.place = this.buy = false;
        return result;
    }
}
