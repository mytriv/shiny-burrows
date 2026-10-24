import Phaser from 'phaser';
import { GameController } from '../../app/GameController';
import { BrowserInput } from '../../app/BrowserInput';
import { firstBurrow } from '../../content/levels/first-burrow';
import { TILE_SIZE } from '../../core/constants';
import { createTiles } from './tiles';
import { digTarget, validateDig } from '../../core/mining';
import { bridgeTarget, validateBridge } from '../../core/bridges';
import { medal, oreExposed, treasureHint } from '../../core/discovery';
import { type GameEvent, type Vec2 } from '../../core/model';
import { boundCamera, cameraConfig, followCamera, screenToWorld } from '../../app/camera';
export class LevelScene extends Phaser.Scene {
  private controller = new GameController(firstBurrow);
  private controls: BrowserInput | undefined;
  private mole: Phaser.GameObjects.Image | undefined;
  private tileImages: Phaser.GameObjects.Image[] = [];
  private overlayImages = new Map<string, Phaser.GameObjects.Image>();
  private preview: Phaser.GameObjects.Graphics | undefined;
  private renderedTiles = this.controller.state.tiles;
  private bridgeImages: Phaser.GameObjects.Image[] = [];
  private rockImages = new Map<string, Phaser.GameObjects.Image>();
  private warning: Phaser.GameObjects.Graphics | undefined;
  private feedbackUntil = 0;
  private cameraPosition: Vec2 = { x: 0, y: 0 };
  private cameraSettings = cameraConfig(520, 500, firstBurrow.width * 32, firstBurrow.height * 32);
  private reduced = false;
  private oreIndices: number[] = [];
  create() {
    createTiles(this);
    this.cameras.main.setBackgroundColor('#39282a');
    const level = this.controller.level;
    const surface = this.add.graphics();
    surface.fillStyle(0x3c5961).fillRect(0, 0, level.width * 32, 96);
    surface.fillStyle(0xb2b9a1).fillRect(100, 24, 36, 5).fillRect(108, 20, 20, 5).fillRect(510, 46, 42, 5);
    level.tiles.forEach((tile, i) => { this.tileImages.push(this.add.image(i % level.width * 32 + 16, Math.floor(i / level.width) * 32 + 16, this.textureAt(i)).setDisplaySize(32, 32).setVisible(!(tile.kind === 'empty' && i < level.width * 3))); if (tile.kind === 'ore_soil') this.oreIndices.push(i); });
    const entrance = this.add.graphics();
    entrance.fillStyle(0x604136).fillRect(48, 111, 6, 49).fillRect(106, 111, 6, 49).fillRect(48, 109, 64, 7);
    entrance.fillStyle(0xd6a563).fillRect(49, 110, 62, 3);
    this.add.text(80, 120, 'HOME', { fontFamily: 'monospace', fontSize: '10px', color: '#ffe4a3' }).setOrigin(0.5);
    level.overlays.forEach(o => this.overlayImages.set(o.id, this.add.image(o.cell.x * 32 + 16, o.cell.y * 32 + 16, `tile-${o.kind === 'secret' ? 'secret_entrance' : o.kind}`).setDisplaySize(32, 32)));
    this.preview = this.add.graphics().setDepth(3);
    this.warning = this.add.graphics().setDepth(4);
    this.controller.state.boulders.forEach(rock => this.rockImages.set(rock.id, this.add.image(rock.position.x + 16, rock.position.y + 16, 'tile-boulder').setDisplaySize(32, 32).setDepth(2)));
    const p = this.controller.state.player.position;
    this.mole = this.add.image(p.x, p.y - 13, 'mole').setDisplaySize(28, 28).setDepth(2);
    this.cameras.main.setBounds(0, 0, level.width * TILE_SIZE, level.height * TILE_SIZE);
    const layout = () => {
      this.cameraSettings = cameraConfig(this.scale.width, this.scale.height, level.width * 32, level.height * 32);
      this.cameras.main.setZoom(this.cameraSettings.zoom);
      this.cameraPosition = boundCamera(this.cameraPosition, this.cameraSettings);
      this.applyCamera();
    };
    this.scale.on('resize', layout); layout();
    const parent = document.querySelector('#game');
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) this.scale.resize(Math.floor(rect.width), Math.floor(rect.height));
    });
    if (parent) observer.observe(parent);
    this.events.once('shutdown', () => observer.disconnect());
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPosition = followCamera(this.cameraPosition, p, 1, false, this.cameraSettings, 0, true); this.applyCamera();
    this.controls = new BrowserInput(() => this.controller.pause(), () => this.restart());
    const aim = (pointer: Phaser.Input.Pointer) => { const point = screenToWorld({ x: pointer.x, y: pointer.y }, this.cameraPosition, this.cameraSettings); if (this.controls) this.controls.target = { x: Math.floor(point.x / 32), y: Math.floor(point.y / 32) }; };
    this.input.on('pointerdown', aim);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (pointer.isDown) aim(pointer); });
    const blur = () => { this.controls?.clear(); this.controller.pause(true); };
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  }
  private texture(kind: string): string { return `tile-${kind === 'soil' ? 'dirt' : kind === 'ore_soil' ? 'gold_dirt' : kind}`; }
  private textureAt(index: number): string { const state = this.controller.state, tile = state.tiles[index]; if (!tile) return 'tile-empty'; const cell = { x: index % state.level.width, y: Math.floor(index / state.level.width) }; return tile.kind === 'ore_soil' && !oreExposed(state, cell) ? 'tile-concealed' : this.texture(tile.kind); }
  private applyCamera() { const c = this.cameraSettings; this.cameras.main.centerOn(this.cameraPosition.x + c.viewWidth / 2, this.cameraPosition.y + c.viewHeight / 2); }
  private toast(message: string) { const feedback = document.querySelector('#feedback'); if (feedback) feedback.textContent = message; this.feedbackUntil = this.time.now + 2200; }
  private burst(at: Vec2, color: number, label = '') {
    if (label) { const text = this.add.text(at.x, at.y - 12, label, { fontFamily: 'monospace', fontSize: '10px', color: `#${color.toString(16).padStart(6, '0')}`, backgroundColor: '#242333' }).setOrigin(0.5).setDepth(10); this.tweens.add({ targets: text, y: this.reduced ? text.y : text.y - 18, alpha: 0, duration: 850, onComplete: () => text.destroy() }); }
    if (this.reduced) return;
    for (const [dx, dy] of [[-8, -6], [7, -8], [-4, 6], [8, 5]]) { const bit = this.add.rectangle(at.x, at.y, 3, 3, color).setDepth(8); this.tweens.add({ targets: bit, x: at.x + (dx ?? 0), y: at.y + (dy ?? 0), alpha: 0, duration: 240, onComplete: () => bit.destroy() }); }
  }
  private feedback(events: readonly GameEvent[]) {
    const s = this.controller.state, at = s.player.position;
    for (const event of events) switch (event.type) {
      case 'TileDug': this.burst({ x: event.cell.x * 32 + 16, y: event.cell.y * 32 + 16 }, 0xc98f59); break;
      case 'TreasureCollected': this.burst({ x: at.x, y: at.y - 18 }, 0xffd76a, `+${event.value} gold`); this.toast(`+${event.value} treasure and coins!`); break;
      case 'BridgeBought': this.toast('Bought 1 bridge kit. Aim at a gap and Place.'); break;
      case 'BridgePlaced': this.burst({ x: event.cell.x * 32 + 16, y: event.cell.y * 32 }, 0xd7b276, 'Built!'); this.toast('Bridge built • 1 kit and 1 energy used.'); break;
      case 'BoulderReleased': this.toast('Loose rock! Step aside.'); break;
      case 'BoulderImpact': this.burst(event.at, 0xb7b4a6, 'THUD'); break;
      case 'TileBroken': this.burst({ x: event.cell.x * 32 + 16, y: event.cell.y * 32 + 16 }, 0xe5c18d, 'CRACK'); this.toast('Cracked floor broken • a new opening!'); break;
      case 'SecretFound': this.burst({ x: at.x, y: at.y - 18 }, 0xe6b0dd, 'SECRET!'); this.toast('Secret found!'); break;
      case 'QuotaReached': this.toast('Gold goal reached! Find the green exit.'); break;
      case 'LevelWon': this.burst({ x: at.x, y: at.y - 24 }, 0xffd76a, 'COMPLETE!'); break;
      case 'ActionRejected': this.toast(this.reasonLabel(event.reason)); break;
    }
    if (events.some(e => e.type === 'BoulderMoved') && s.tick % 12 === 0) { const rock = s.boulders.find(b => b.falling); if (rock) this.burst({ x: rock.position.x + 16, y: rock.position.y + 32 }, 0x9c917d); }
  }
  private reasonLabel(reason: string | null): string { const labels: Record<string, string> = { outOfRange: 'Aim at a nearby block', indestructible: 'Claws cannot dig this block', insufficientEnergy: 'No energy for tools • Restart is available', cooldown: 'Claws ready in a moment', playerOverlap: 'Choose a cell outside the mole', outOfBounds: 'Keep your target inside the mine', notGrounded: 'Stand on a bank before building', occupied: 'Choose an empty gap', insufficientFunds: 'Need 5 coins to buy a kit', noBridgeKit: 'Buy a bridge kit first' }; return reason ? labels[reason] ?? reason : 'Ready'; }
  private restart() {
    this.controller.restart(); this.controls?.clear();
    if (this.controls) { this.controls.tool = 'claws'; this.controls.target = undefined; this.controls.direction = undefined; }
    this.feedbackUntil = 0;
    const p = this.controller.state.player.position;
    this.mole?.setPosition(p.x, p.y - 13); this.cameraPosition = followCamera(this.cameraPosition, p, 1, false, this.cameraSettings, 0, true); this.applyCamera();
  }
  update(_time: number, delta: number) {
    if (!this.controls || !this.mole) return;
    const input = this.controls.read(); this.controller.queue(input); const events = this.controller.advance(delta / 1000);
    const s = this.controller.state, old = this.controller.previous, t = s.status === 'playing' && !this.controller.paused ? this.controller.alpha : 1;
    this.mole.setPosition(Phaser.Math.Linear(old.player.position.x, s.player.position.x, t), Phaser.Math.Linear(old.player.position.y, s.player.position.y, t) - 13).setFlipX(s.player.facing < 0);
    this.mole.setAlpha(s.player.alive ? 1 : 0.45);
    this.cameraPosition = followCamera(this.cameraPosition, { x: this.mole.x, y: this.mole.y + 13 }, s.player.facing, s.player.velocity.y > 40, this.cameraSettings, delta / 1000, this.reduced); this.applyCamera();
    this.feedback(events);
    this.warning?.clear();
    s.boulders.forEach(rock => {
      const before = old.boulders.find(b => b.id === rock.id) ?? rock;
      const x = Phaser.Math.Linear(before.position.x, rock.position.x, t), y = Phaser.Math.Linear(before.position.y, rock.position.y, t);
      this.rockImages.get(rock.id)?.setPosition(x + 16, y + 16);
      if (rock.falling) this.warning?.lineStyle(2, 0xffdc68).strokeRect(x, y, 32, 32).fillStyle(0xffdc68).fillTriangle(x + 12, y - 5, x + 20, y - 5, x + 16, y - 1);
    });
    const hud = document.querySelector('#stats');
    if (hud) hud.textContent = `◆ Gold ${s.goldCollectedValue}/${s.level.treasureQuota}  ● Coins ${s.wallet}  ♥ Energy ${s.player.energy}  ▰ Kits ${s.bridgeInventory}  ? Secret ${s.discoveredSecrets.length ? '✓' : '—'}${this.controller.paused ? ' · PAUSED' : ''}`;
    if (this.renderedTiles !== s.tiles) { s.tiles.forEach((tile, i) => { if (tile !== this.renderedTiles[i]) this.tileImages[i]?.setTexture(this.textureAt(i)); }); this.renderedTiles = s.tiles; }
    this.oreIndices.forEach(i => { if (s.tiles[i]?.kind === 'ore_soil') { const texture = this.textureAt(i); if (this.tileImages[i]?.texture.key !== texture) this.tileImages[i]?.setTexture(texture); } });
    this.overlayImages.forEach((image, id) => image.setVisible(!s.collectedLootIds.includes(id)));
    if (this.bridgeImages.length !== s.bridges.length) { this.bridgeImages.forEach(image => image.destroy()); this.bridgeImages = s.bridges.map(cell => this.add.image(cell.x * 32 + 16, cell.y * 32 + 16, 'bridge').setDisplaySize(32, 32)); }
    const bridge = this.controls.tool === 'bridge';
    const target = bridge ? bridgeTarget(s, input) : digTarget(s, input);
    const reason = bridge ? validateBridge(s, target) : validateDig(s, target), valid = reason === null;
    this.preview?.clear().lineStyle(2, valid ? 0x9fea6d : 0xee8a77).strokeRect(target.x * 32 + 1, target.y * 32 + 1, 30, 30);
    if (bridge) this.preview?.fillStyle(valid ? 0x9fea6d : 0xee8a77, 0.55).fillRect(target.x * 32, target.y * 32, 32, 5);
    const toolStatus = document.querySelector('#tool-status');
    if (toolStatus) toolStatus.textContent = `${bridge ? 'Bridge • Place: 1 kit + 1 energy' : 'Claws • Dig: 1 energy'} · ${valid ? '✓ Ready' : `× ${this.reasonLabel(reason)}`}`;
    const confirm = document.querySelector('[data-action="confirm"]'); if (confirm) confirm.textContent = bridge ? 'Place' : 'Dig';
    document.querySelector('[data-action="bridge"]')?.setAttribute('aria-pressed', String(bridge));
    document.querySelector('[data-action="claws"]')?.setAttribute('aria-pressed', String(!bridge));
    const feedback = document.querySelector('#feedback');
    if (feedback && s.status === 'won') feedback.textContent = `${medal(s)?.toUpperCase()} • COMPLETE! Gold ${s.goldCollectedValue}, coins ${s.wallet}, energy used ${s.level.initialEnergy - s.player.energy}. Restart to explore again.`;
    else if (feedback && s.status === 'failed') feedback.textContent = 'Oops! Try again — tap Restart or press R.';
    else if (feedback && this.controller.paused) feedback.textContent = 'PAUSED · Pause/Esc to resume';
    else if (feedback && this.time.now >= this.feedbackUntil) feedback.textContent = s.player.energy === 0 ? 'No energy for tools. You can still move, reach the exit or restart.' : treasureHint(s) ? 'A faint gold glint is nearby…' : s.goldCollectedValue >= s.level.treasureQuota ? 'Goal reached! Find the green exit deeper to the right.' : 'Mine ore for 16 gold. Buy bridges or dig your own route.';
    // Read-only inspection surface: tests never inject state or bypass input.
    this.game.canvas.dataset.state = JSON.stringify({ ...s, level: undefined, tiles: undefined, paused: this.controller.paused });
    this.game.canvas.dataset.view = JSON.stringify({ ...this.cameraPosition, zoom: this.cameraSettings.zoom, width: this.cameraSettings.viewWidth, height: this.cameraSettings.viewHeight });
    this.game.canvas.dataset.target = JSON.stringify({ cell: target, valid, reason });
    this.game.canvas.setAttribute('aria-label', `Shiny Burrows: ${s.status}`);
  }
}
