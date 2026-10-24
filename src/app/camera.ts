import { type Vec2 } from '../core/model';
export type CameraConfig = Readonly<{
    width: number;
    height: number;
    worldWidth: number;
    worldHeight: number;
    zoom: number;
    viewWidth: number;
    viewHeight: number;
}>;
export function cameraConfig(width: number, height: number, worldWidth: number, worldHeight: number): CameraConfig {
    width = Math.max(1, width);
    height = Math.max(1, height);
    const zoom = Math.max(width < 600 ? 1.85 : width < 1000 ? 2.3 : 4, width / worldWidth, height / worldHeight);
    return { width, height, worldWidth, worldHeight, zoom, viewWidth: width / zoom, viewHeight: height / zoom };
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function boundCamera(p: Vec2, c: CameraConfig): Vec2 { return { x: clamp(p.x, 0, Math.max(0, c.worldWidth - c.viewWidth)), y: clamp(p.y, 0, Math.max(0, c.worldHeight - c.viewHeight)) }; }
export function followCamera(previous: Vec2, player: Vec2, facing: number, falling: boolean, c: CameraConfig, dt: number, snap = false): Vec2 {
    const target = boundCamera({ x: player.x + facing * 18 - c.viewWidth / 2, y: player.y - c.viewHeight * (falling ? 0.36 : 0.46) }, c);
    const t = snap ? 1 : 1 - Math.exp(-Math.min(Math.max(0, dt), 0.1) * (falling ? 12 : 8));
    const smooth = { x: previous.x + (target.x - previous.x) * t, y: previous.y + (target.y - previous.y) * t };
    // Prevent camera lag from letting the character leave the comfortable safe area.
    return boundCamera({ x: clamp(smooth.x, player.x - c.viewWidth * 0.76, player.x - c.viewWidth * 0.24), y: clamp(smooth.y, player.y - c.viewHeight * 0.70, player.y - c.viewHeight * 0.18) }, c);
}
export function screenToWorld(screen: Vec2, camera: Vec2, config: Pick<CameraConfig, 'zoom'>): Vec2 { return { x: camera.x + screen.x / config.zoom, y: camera.y + screen.y / config.zoom }; }

