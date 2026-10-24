import Phaser from 'phaser';
import { GameController } from '../../app/GameController';
import { BrowserInput } from '../../app/BrowserInput';
import { firstBurrow, adventureLevels } from '../../content/levels/first-burrow';
import { createTiles } from './tiles';
import { boundCamera, cameraConfig, followCamera } from '../../app/camera';
import { ladderAt } from '../../core/ladders';
import { platformTarget, validatePlatform, platformSupports } from '../../core/platforms';
import { BALANCE } from '../../core/config';
import type { Vec2, Tile, GameEvent } from '../../core/model';
export class LevelScene extends Phaser.Scene {
    private controller = new GameController(firstBurrow, adventureLevels);
    private controls: BrowserInput | undefined;
    private mole: Phaser.GameObjects.Image | undefined;
    private tileImages: Phaser.GameObjects.Image[] = [];
    private decor: Phaser.GameObjects.GameObject[] = [];
    private markers: Phaser.GameObjects.Graphics | undefined;
    private rocks = new Map<string, Phaser.GameObjects.Image>();
    private renderedTiles: readonly Tile[] = [];
    private lastDig = -100;
    private feedbackUntil = 0;
    private blockedUntil = 0;
    private transients = new Set<Phaser.GameObjects.GameObject>();
    private cameraPosition: Vec2 = { x: 0, y: 0 };
    private cameraSettings = cameraConfig(520, 500, 512, 864);
    private reduced = false;
    create() {
        createTiles(this);
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.cameras.main.setBackgroundColor('#493e43');
        this.markers = this.add.graphics().setDepth(2);
        this.mole = this.add.image(80, 115, 'mole-idle-0').setDisplaySize(34, 34).setDepth(4);
        this.rebuild();
        const layout = () => this.layout();
        this.scale.on('resize', layout);
        this.layout();
        const observer = new ResizeObserver(entries => { const r = entries[0]?.contentRect; if (r && r.width > 0 && r.height > 0)
            this.scale.resize(Math.floor(r.width), Math.floor(r.height)); });
        const parent = document.querySelector('#game');
        if (parent)
            observer.observe(parent);
        this.controls = new BrowserInput(() => this.controller.pause(), () => { this.controller.restart(); this.controls?.clear(); this.clearEffects(); this.lastDig = -100; this.cameraPosition = { x: 0, y: 0 }; });
        const upgrade = () => this.controller.buyUpgrade(), next = () => { this.controls?.clear(); this.controller.continue(); this.rebuild(); }, fresh = () => { this.controls?.clear(); this.controller.newAdventure(); this.rebuild(); };
        document.querySelector('#upgrade')?.addEventListener('click', upgrade);
        document.querySelector('#next')?.addEventListener('click', next);
        document.querySelector('#new-adventure')?.addEventListener('click', fresh);
        const blur = () => { this.controls?.clear(); this.controller.pause(true); };
        const visibility = () => { if (document.hidden)
            blur(); };
        window.addEventListener('blur', blur);
        document.addEventListener('visibilitychange', visibility);
        this.events.once('shutdown', () => { observer.disconnect(); this.scale.off('resize', layout); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); this.controls?.destroy(); document.querySelector('#upgrade')?.removeEventListener('click', upgrade); document.querySelector('#next')?.removeEventListener('click', next); document.querySelector('#new-adventure')?.removeEventListener('click', fresh); });
    }
    private layout() { const l = this.controller.level; this.cameraSettings = cameraConfig(this.scale.width, this.scale.height, l.width * 32, l.height * 32); this.cameras.main.setBounds(0, 0, l.width * 32, l.height * 32).setZoom(this.cameraSettings.zoom); this.cameraPosition = boundCamera(this.cameraPosition, this.cameraSettings); }
    private clearEffects(): void {
        for (const object of this.transients) { this.tweens.killTweensOf(object); object.destroy(); }
        this.transients.clear(); this.feedbackUntil = 0; this.blockedUntil = 0;
        if (this.mole) { this.tweens.killTweensOf(this.mole); this.mole.setDisplaySize(34,34); }
    }
    private rebuild() {
        this.clearEffects();
        this.tileImages.forEach(i => i.destroy());
        this.decor.forEach(i => i.destroy());
        this.rocks.forEach(i => i.destroy());
        this.tileImages = [];
        this.decor = [];
        this.rocks.clear();
        const l = this.controller.level, bg = this.add.graphics().setDepth(-2);
        this.decor.push(bg);
        bg.fillStyle(0xade1da).fillRect(0, 0, l.width * 32, 128);
        bg.fillStyle(0x88b7a7).fillEllipse(90, 117, 230, 95).fillEllipse(390, 118, 290, 90);
        bg.fillStyle(0x658c7b).fillEllipse(220, 138, 230, 70).fillEllipse(470, 142, 220, 90);
        bg.fillStyle(0xe8f1ca).fillRoundedRect(80, 30, 70, 12, 6).fillRoundedRect(340, 45, 55, 10, 5);
        bg.fillStyle(0x3b333f).fillRect(0, 128, l.width * 32, l.height * 32 - 128);
        for (let y = 160; y < l.height * 32; y += 150) {
            bg.fillStyle(0x4b3c44).fillEllipse(200 + (y % 70), y, 400, 105);
            bg.fillStyle(0x52424a).fillEllipse(430, y + 55, 140, 80);
        }
        this.controller.state.tiles.forEach((t, i) => this.tileImages.push(this.add.image(i % l.width * 32 + 16, Math.floor(i / l.width) * 32 + 16, this.tileTexture(t)).setDisplaySize(32, 32).setVisible(!(t.kind === 'empty' && i < l.width * 4))));
        // Ordinary mine entrance, with a readable direction sign rather than story content.
        const home = this.add.graphics().setDepth(1);
        home.fillStyle(0x6b4e37).fillRect(43, 88, 6, 40).fillRect(104, 88, 6, 40).fillRect(43, 86, 67, 8);
        home.fillStyle(0xf2d293).fillRect(44, 86, 65, 3);
        this.decor.push(home);
        this.decor.push(this.add.text(77, 99, 'DIG ↓', { fontFamily: 'sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#fff1c9', backgroundColor: '#685440' }).setOrigin(.5).setDepth(1));
        for (const o of l.overlays) {
            const image = this.add.image(o.cell.x * 32 + 16, o.cell.y * 32 + 16, o.kind).setDisplaySize(32, 32).setDepth(1);
            this.decor.push(image);
        }
        this.controller.state.boulders.forEach(r => this.rocks.set(r.id, this.add.image(r.position.x + 16, r.position.y + 16, 'boulder').setDisplaySize(32, 32).setDepth(3)));
        this.renderedTiles = this.controller.state.tiles;
        this.lastDig = -100;
        this.cameraPosition = { x: 0, y: 0 };
        this.layout();
    }
    private tileTexture(t: Tile): string {
        if (t.kind === 'empty')
            return 'terrain-empty';
        const max = t.maxIntegrity ?? 1;
        const stage = t.currentIntegrity === undefined ? 0 : Math.min(3, Math.ceil((1 - t.currentIntegrity / max) * 3));
        return 'terrain-' + (t.kind === 'ore_soil' ? 'ore-' + (t.oreStratum ? {soil:1,compacted:2,gravel:3,hard:5}[t.oreStratum] : t.hardness ?? 1) : t.kind) + '-' + stage;
    }
    private toast(message: string) { const el = document.querySelector('#feedback'); if (el)
        el.textContent = message; this.feedbackUntil = this.time.now + 2200; }
    private effects(events: readonly GameEvent[]) {
        for (const e of events) {
            if (e.type === 'Landed' && !this.reduced && this.mole) {
                this.mole.setScale(34 / 64, 30 / 64);
                this.tweens.add({ targets: this.mole, scaleX: 34 / 64, scaleY: 34 / 64, duration: 130 });
            }
            if (e.type === 'TileHit')
                this.lastDig = this.controller.state.tick;
            if (e.type === 'TreasureCollected') {
                this.toast('+' + e.value + ' gold!');
                const p = this.controller.state.player.position;
                const text = this.add.text(p.x, p.y - 22, '+' + e.value, { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe393', stroke: '#5c3d38', strokeThickness: 3 }).setOrigin(.5).setDepth(8);
                this.transients.add(text);
                this.tweens.add({ targets: text, y: text.y - (this.reduced ? 0 : 20), alpha: 0, duration: 800, onComplete: () => { this.transients.delete(text); text.destroy(); } });
            }
            if (e.type === 'SolidBlocked') {
                this.blockedUntil = this.time.now + 180;
                this.toast('Solid rock · Choose another direction');
            }
            if (e.type === 'PlatformBought')
                this.toast('One platform ready to place.');
            if (e.type === 'PlatformPlaced')
                this.toast('Platform built. Press Down to drop through.');
            if (e.type === 'BoulderReleased')
                this.toast('Loose rock — step aside!');
            if (e.type === 'QuotaReached')
                this.toast('Gold goal reached! Find the green exit.');
            if ((e.type === 'TileDug' || e.type === 'TileHit') && !this.reduced) {
                const at = e.cell;
                for (const dx of [-6, 6]) {
                    const bit = this.add.circle(at.x * 32 + 16, at.y * 32 + 16, 1.8, 0xf2c78b).setDepth(7);
                    this.transients.add(bit);
                    this.tweens.add({ targets: bit, x: bit.x + dx, y: bit.y + 8, alpha: 0, duration: 180, onComplete: () => { this.transients.delete(bit); bit.destroy(); } });
                }
            }
        }
    }
    private hud() {
        const s = this.controller.state, campaign = this.controller.campaign, playing = s.status === 'playing' && !this.controller.paused;
        const text = (selector: string, value: string) => { const el = document.querySelector(selector); if (el && el.textContent !== value)
            el.textContent = value; };
        text('#stats', '◆ ' + s.levelGoldCollected + '/' + s.level.treasureQuota + ' gold   ● ' + s.wallet + ' coins   ⛏ ' + s.pickaxePower + '   ▰ ' + s.inventory.platforms + '   ↓ ' + (s.level.depth + Math.max(0, Math.floor(s.player.position.y / 32) - 4)) + 'm');
        text('#level-name', s.level.name);
        text('[data-action=buy]', 'Buy ▰ '+BALANCE.platformPrice);
        const disabled = (action: string, value: boolean) => { const el = document.querySelector<HTMLButtonElement>('[data-action="' + action + '"]'); if (el)
            el.disabled = value; };
        const ladder = ladderAt(s);
        disabled('up', !playing);
        disabled('down', !playing || (!ladder && !s.player.grounded));
        disabled('platform', !playing || validatePlatform(s) !== null);
        disabled('buy', !playing || s.wallet < BALANCE.platformPrice);
        if (this.controller.paused)
            text('#feedback', 'Paused · Pause or Esc to resume');
        else if (s.status === 'failed')
            text('#feedback', 'Try another route · Restart');
        else if (this.time.now >= this.feedbackUntil)
            text('#feedback', s.levelGoldCollected >= s.level.treasureQuota ? 'Gold goal reached · Green exit below' : s.platforms.some(p => platformSupports(s, p)) ? 'Down drops through this platform' : ladder ? 'Hold ↑ / ↓ to climb or dig' : 'Hold a direction to move + dig · Falling leaves ladders');
        const station = document.querySelector<HTMLElement>('#station');
        if (station)
            station.hidden = !campaign || campaign.phase === 'playing';
        if (campaign) {
            text('#station-stats', 'Coins ' + campaign.wallet + ' · Pickaxe power ' + (campaign.pickaxeTier + 1) + ' · Mines complete ' + campaign.completed.length + '/3');
            const cost = BALANCE.upgradePrices[campaign.pickaxeTier];
            const button = document.querySelector<HTMLButtonElement>('#upgrade');
            if (button) {
                button.textContent = cost === undefined ? 'Pickaxe fully upgraded' : 'Power ' + (campaign.pickaxeTier + 2) + ' — ' + cost + ' coins';
                button.disabled = campaign.phase !== 'surface' || cost === undefined || campaign.wallet < cost;
            }
            text('#station-title', campaign.phase === 'finished' ? 'Three lovely burrows complete!' : 'Surface workshop');
        }
        const next = document.querySelector<HTMLButtonElement>('#next');
        if (next)
            next.hidden = campaign?.phase !== 'surface';
    }
    update(_time: number, delta: number) {
        if (!this.controls || !this.mole || !this.markers)
            return;
        const input = this.controls.read();
        this.controller.queue(input);
        const events = this.controller.advance(delta / 1000);
        const s = this.controller.state, old = this.controller.previous, alpha = s.status === 'playing' && !this.controller.paused ? this.controller.alpha : 1;
        this.effects(events);
        const mode = s.tick - this.lastDig < 12 ? 'dig' : (s.player.climbing && Math.abs(s.player.velocity.y) > 1) || Math.abs(s.player.velocity.x) > 1 ? 'walk' : s.player.velocity.y > 40 ? 'fall' : 'idle';
        const frame = this.controller.paused ? 0 : Math.floor(s.tick / 5) % 6;
        this.mole.setTint(this.time.now < this.blockedUntil ? 0xffc18c : 0xffffff).setAngle(this.time.now < this.blockedUntil ? -5 * s.player.facing : 0);
        this.mole.setTexture('mole-' + mode + '-' + frame).setPosition(Phaser.Math.Linear(old.player.position.x, s.player.position.x, alpha), Phaser.Math.Linear(old.player.position.y, s.player.position.y, alpha) - 14).setFlipX(s.player.facing < 0).setAlpha(s.player.alive ? 1 : .45);
        this.cameraPosition = followCamera(this.cameraPosition, { x: this.mole.x, y: this.mole.y + 14 }, s.player.facing, s.player.velocity.y > 40, this.cameraSettings, delta / 1000, this.reduced);
        const c = this.cameraSettings;
        this.cameras.main.centerOn(this.cameraPosition.x + c.viewWidth / 2, this.cameraPosition.y + c.viewHeight / 2);
        if (this.renderedTiles !== s.tiles) {
            s.tiles.forEach((t, i) => { if (t !== this.renderedTiles[i])
                this.tileImages[i]?.setTexture(this.tileTexture(t)).setVisible(!(t.kind === 'empty' && i < s.level.width * 4)); });
            this.renderedTiles = s.tiles;
        }
        this.markers.clear();
        for (const p of s.ladders) {
            const x = p.x * 32, y = p.y * 32;
            this.markers.fillStyle(0x543b2b).fillRect(x + 7, y, 4, 32).fillRect(x + 23, y, 4, 32).fillStyle(0xc18b4d).fillRect(x + 6, y, 3, 32).fillRect(x + 22, y, 3, 32);
            for (let r = 5; r < 32; r += 10)
                this.markers.fillStyle(0xf3cd89).fillRect(x + 8, y + r, 16, 3);
        }
        for (const p of s.platforms) {
            this.markers.fillStyle(0x62412f).fillRect(p.x * 32, p.y * 32, 32, 7).fillStyle(0xe3b16d).fillRect(p.x * 32, p.y * 32, 32, 4).fillStyle(0xffdea1).fillRect(p.x * 32, p.y * 32, 32, 1);
        }
        const target = platformTarget(s), valid = validatePlatform(s) === null;
        if (s.inventory.platforms && s.status === 'playing')
            this.markers.lineStyle(1, valid ? 0xa6eb9b : 0xdba18e).strokeRect(target.x * 32, target.y * 32, 32, 6);
        s.boulders.forEach(r => { const before = old.boulders.find(b => b.id === r.id) ?? r; const x = Phaser.Math.Linear(before.position.x, r.position.x, alpha), y = Phaser.Math.Linear(before.position.y, r.position.y, alpha); this.rocks.get(r.id)?.setPosition(x + 16, y + 16); if (r.falling)
            this.markers?.lineStyle(2, 0xffcc65).strokeRect(x, y, 32, 32); });
        this.hud();
        this.game.canvas.dataset.input = JSON.stringify(input);
        // Inspection only: no mutation or browser gameplay APIs are exposed.
        this.game.canvas.dataset.state = JSON.stringify({ ...s, level: undefined, tiles: undefined, paused: this.controller.paused });
        this.game.canvas.dataset.campaign = JSON.stringify(this.controller.campaign);
        this.game.canvas.dataset.view = JSON.stringify({ ...this.cameraPosition, zoom: c.zoom, width: c.viewWidth, height: c.viewHeight });
        this.game.canvas.dataset.damage = JSON.stringify(s.tiles.flatMap((t, i) => t.currentIntegrity !== undefined && t.currentIntegrity < (t.maxIntegrity ?? 0) ? [{ index: i, current: t.currentIntegrity, max: t.maxIntegrity }] : []));
        this.game.canvas.dataset.animation = this.mole.texture.key;
        this.game.canvas.setAttribute('aria-label', 'Shiny Burrows · ' + s.level.name + ' · ' + s.status);
    }
}
