import Phaser from 'phaser';
import { GameController } from '../../app/GameController';
import { firstDig } from '../../content/levels/first-dig';
import { type Command, type GameEvent, type GameState } from '../../core/model';
import { medal, treasurePercent } from '../../core/scoring';
import { createTiles } from './tiles';

export class LevelScene extends Phaser.Scene {
  private controller = new GameController(firstDig);
  private busy = false;
  private lastInput = -Infinity;
  private board: Phaser.GameObjects.Container | undefined;
  private hud: Phaser.GameObjects.Text | undefined;
  private controls: Phaser.GameObjects.Container[] = [];
  private footer: Phaser.GameObjects.Text | undefined;
  constructor() { super('level'); }
  create() {
    createTiles(this);
    this.cameras.main.setBackgroundColor('#242333');
    const panel = this.add.graphics();
    this.hud = this.add.text(260, 20, '', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '19px', lineSpacing: 5, color: '#ffe9a8', align: 'center', wordWrap: { width: 480 } }).setOrigin(0.5, 0);
    this.board = this.add.container(20, 160);
    const button = (x: number, y: number, label: string, command: Command, width = 68) => {
      const bg = this.add.rectangle(0, 0, width, 60, 0x635344).setStrokeStyle(2, 0x261f2b).setInteractive({ useHandCursor: true });
      const top = this.add.rectangle(0, -26, width - 6, 4, 0xd7b276);
      const bottom = this.add.rectangle(0, 26, width - 6, 4, 0x3e3240);
      const text = this.add.text(0, 0, label, { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '18px', color: '#fff0c1' }).setOrigin(0.5);
      this.controls.push(this.add.container(x, y, [bg, top, bottom, text]));
      bg.on('pointerover', () => bg.setFillStyle(0x826443));
      bg.on('pointerout', () => bg.setFillStyle(0x635344));
      bg.on('pointerdown', () => this.issue(command));
    };
    button(260, 640, '↑', 'MoveUp'); button(180, 700, '←', 'MoveLeft');
    button(260, 700, '↓', 'MoveDown'); button(340, 700, '→', 'MoveRight');
    button(130, 575, 'Undo', 'Undo', 110); button(260, 575, 'Restart', 'Restart', 110); button(390, 575, 'Pause', 'Pause', 110);
    this.footer = this.add.text(260, 752, 'Arrows/WASD · Z undo · R restart · Esc pause', { fontFamily: 'monospace', fontSize: '14px', color: '#bda98e' }).setOrigin(0.5);
    const layout = () => {
      const landscape = this.scale.parentSize.width > this.scale.parentSize.height;
      const width = landscape ? 900 : 520, height = landscape ? 420 : 800;
      if (this.scale.width !== width || this.scale.height !== height) this.scale.setGameSize(width, height);
      panel.clear();
      panel.fillStyle(0x151d2b).fillRect(landscape ? 22 : 12, 8, landscape ? 452 : 496, 136);
      panel.lineStyle(2, 0x927754).strokeRect(landscape ? 22 : 12, 8, landscape ? 452 : 496, 136);
      panel.fillStyle(0xd7b276).fillRect(landscape ? 24 : 14, 10, landscape ? 448 : 492, 3);
      this.hud?.setPosition(landscape ? 248 : 260, 22).setFontSize(landscape ? 17 : 19).setWordWrapWidth(landscape ? 420 : 468);
      this.board?.setPosition(landscape ? 35 : 20, landscape ? 154 : 160).setScale(landscape ? 0.65 : 1);
      const positions = landscape ? [[680, 105], [600, 175], [680, 175], [760, 175], [550, 270], [680, 270], [810, 270]] : [[260, 640], [180, 700], [260, 700], [340, 700], [130, 575], [260, 575], [390, 575]];
      this.controls.forEach((control, i) => { const point = positions[i]; if (point) control.setPosition(point[0] ?? 0, point[1] ?? 0); });
      this.footer?.setPosition(landscape ? 660 : 260, landscape ? 360 : 752);
    };
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
    layout();
    const keys: Record<string, Command> = { ArrowUp: 'MoveUp', w: 'MoveUp', ArrowDown: 'MoveDown', s: 'MoveDown', ArrowLeft: 'MoveLeft', a: 'MoveLeft', ArrowRight: 'MoveRight', d: 'MoveRight', z: 'Undo', r: 'Restart', Escape: 'Pause' };
    this.input.keyboard?.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      const command = keys[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (command) { event.preventDefault(); this.issue(command); }
    });
    const onBlur = () => { if (!this.controller.paused) { this.controller.command('Pause'); this.refresh(); } };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
    this.refresh();
  }
  private issue(command: Command) {
    if (this.busy) return;
    const directional = command.startsWith('Move');
    if (directional && this.time.now - this.lastInput < 140) return;
    const before = this.controller.session.state;
    const result = this.controller.command(command);
    if (directional && result?.accepted) this.lastInput = this.time.now;
    if (result?.accepted && result.events.length) {
      this.busy = true;
      this.animate(before, result.events, 0);
    } else this.refresh();
  }
  private animate(frame: GameState, events: readonly GameEvent[], offset: number) {
    const event = events[offset];
    if (!event) { this.busy = false; this.refresh(); return; }
    let next = frame;
    if (event.type === 'PlayerMoved') next = { ...frame, player: event.to };
    if (event.type === 'TileDug' || event.type === 'TreasureCollected' || event.type === 'FragileSmashed') {
      const cells = frame.cells.slice(); cells[event.at.y * frame.level.width + event.at.x] = { kind: 'empty' }; next = { ...frame, cells };
    }
    if (event.type === 'BoulderMoved') {
      const cells = frame.cells.slice(); cells[event.from.y * frame.level.width + event.from.x] = { kind: 'empty' }; cells[event.to.y * frame.level.width + event.to.x] = { kind: 'boulder' }; next = { ...frame, cells };
    }
    this.draw(next, event.type === 'BoulderWarning' ? event.at : undefined);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time.delayedCall(reduced ? 0 : event.type === 'BoulderWarning' ? 130 : 45, () => this.animate(next, events, offset + 1));
  }
  private refresh() {
    const s = this.controller.session.state;
    const missing = Math.max(0, s.level.treasureGoal - s.collectedValue);
    this.hud?.setText(`SHINY BURROWS / ${s.level.name}\nShiny ${s.collectedValue}/${s.level.treasureGoal}  Steps ${s.steps}  Secret ${s.secretVisited ? 'YES' : '?'}\n${this.controller.paused ? 'PAUSED · Pause to resume' : s.status === 'won' ? `${medal(s)?.toUpperCase()}! ${treasurePercent(s)}% · Restart to replay` : s.status === 'stuck' ? 'Oops! Try Undo or Restart.' : missing ? `Find ${missing} more shiny, then the green door.` : 'Shiny collected! Find the green door.'}`);
    this.draw(s);
    // Accessible browser smoke-test surface, derived entirely from domain state.
    this.game.canvas.setAttribute('aria-label', `Shiny Burrows: ${s.status}, treasure ${s.collectedValue}, steps ${s.steps}${this.controller.paused ? ', paused' : ''}`);
    this.game.canvas.setAttribute('role', 'img');
  }
  private draw(state: GameState, warning?: { x: number; y: number }) {
    const board = this.board;
    if (!board) return;
    board.removeAll(true);
    const frame = this.add.graphics();
    frame.fillStyle(0x151d2b).fillRect(-4, -4, state.level.width * 48 + 8, state.level.height * 48 + 8);
    frame.lineStyle(2, 0xb08b57).strokeRect(-4, -4, state.level.width * 48 + 8, state.level.height * 48 + 8);
    board.add(frame);
    state.cells.forEach((tile, i) => {
      const x = i % state.level.width, y = Math.floor(i / state.level.width);
      const warn = warning?.x === x && warning.y === y;
      board.add(this.add.image(x * 48 + 24, y * 48 + 24, `tile-${tile.kind}`).setScale(2));
      if (warn) {
        const outline = this.add.graphics();
        outline.lineStyle(3, 0xffdc68).strokeRect(x * 48 + 2, y * 48 + 2, 44, 44);
        outline.fillStyle(0xffdc68).fillRect(x * 48 + 3, y * 48 + 2, 4, 10).fillRect(x * 48 + 40, y * 48 + 2, 4, 10);
        board.add(outline);
      }
    });
    const px = state.player.x * 48 + 24, py = state.player.y * 48 + 24;
    board.add(this.add.image(px, py, 'mole').setScale(2));
  }
}
