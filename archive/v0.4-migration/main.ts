import Phaser from 'phaser';
import { LevelScene } from './presentation/phaser/LevelScene';
import './style.css';
new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: 520, height: 800,
    pixelArt: false, roundPixels: false,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [LevelScene], banner: false, backgroundColor: '#1d2028',
});
