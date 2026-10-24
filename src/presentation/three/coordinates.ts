import { TILE_SIZE, PLAYER_HEIGHT, PLAYER_WIDTH } from '../../core/constants';
import type { Vec2 } from '../../core/model';
import {type Group,type OrthographicCamera,type Object3D} from 'three';
import type {CameraConfig} from '../../app/camera';
export const ELEVATION=Math.PI/9;
export const COS=Math.cos(ELEVATION),SIN=Math.sin(ELEVATION);
/** Orthographic elevation with vertical compensation: the z=0 grid still projects as 32px squares. */
export function elevatedCamera(world:Group,camera:OrthographicCamera,origin:Vec2,c:CameraConfig):void {
    world.scale.y=1/COS;camera.left=0;camera.right=c.viewWidth;camera.top=0;camera.bottom=-c.viewHeight;
    camera.position.set(origin.x,-origin.y/COS+1000*SIN,1000*COS);camera.rotation.set(-ELEVATION,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
/** Artistic character projection avoids head/feet parallax while terrain keeps real visible tops. */
export function placeCharacter(root:Object3D,feet:Vec2,groundLift:number):void {
    const [x,y,z]=molePoint(feet);root.matrixAutoUpdate=false;
    root.matrix.set(1,0,0,x,0,1,SIN,y+z*SIN+groundLift,0,0,1,z,0,0,0,1);
}

/** Single gameplay-to-render convention: logical Y down, render Y up, Z decoration. */
export function renderPoint(p: Vec2, z = 0): readonly [number, number, number] { return [p.x, -p.y, z]; }
export function cellPoint(cell: Vec2, z = 0): readonly [number, number, number] {
    return renderPoint({ x: (cell.x + .5) * TILE_SIZE, y: (cell.y + .5) * TILE_SIZE }, z);
}
export function molePoint(feet: Vec2): readonly [number, number, number] {
    return renderPoint({ x: feet.x, y: feet.y - PLAYER_HEIGHT / 2 }, 20);
}
export const VISUAL = { tile: TILE_SIZE, playerWidth: PLAYER_WIDTH, playerHeight: PLAYER_HEIGHT, depth: 22, particleLimit: 48, pixelRatioLimit: 1.5 } as const;
