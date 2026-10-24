import Phaser from 'phaser';
import { LevelScene } from './presentation/phaser/LevelScene';
import './style.css';
new Phaser.Game({
    type: Phaser.HEADLESS, width: 520, height: 800,
    audio: { noAudio: true }, input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    scale: { mode: Phaser.Scale.NONE },
    // Feed elapsed render time to the existing fixed-step accumulator; smoothing can slow gameplay on costly frames.
    fps: { smoothStep: false },
    scene: [LevelScene], banner: false, backgroundColor: '#1d2028',
});
