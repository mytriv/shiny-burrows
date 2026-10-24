import type { CameraConfig } from '../app/camera';
import type { GameState, GameEvent, Vec2 } from '../core/model';
export type RenderFrame = Readonly<{ state: GameState; previous: GameState; alpha: number; dt: number; paused: boolean; camera: Vec2; config: CameraConfig }>;
export interface WorldRenderer {
    readonly canvas: HTMLCanvasElement;
    reset(state: GameState): void;
    resize(width: number, height: number): void;
    effects(events: readonly GameEvent[], state: GameState): void;
    upgrade(): void;
    draw(frame: RenderFrame): void;
    dispose(): void;
}
