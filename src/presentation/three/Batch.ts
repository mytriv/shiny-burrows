import { InstancedMesh, Object3D, Color, type BufferGeometry, type Material } from 'three';
/** Reusable GPU batch. Caller supplies render-space positions through coordinates.ts. */
export class Batch {
    readonly mesh: InstancedMesh;
    private transform = new Object3D();
    private size = 0;
    constructor(geometry: BufferGeometry, material: Material, private capacity: number) {
        this.mesh = new InstancedMesh(geometry,material,capacity);this.mesh.count=0;
    }
    clear():void {this.size=0;}
    add(position: readonly [number,number,number],scale: readonly [number,number,number]=[1,1,1],rotation=0,color?:Color):void {
        if(this.size>=this.capacity)throw new Error('Visual batch capacity exceeded');
        this.transform.position.set(...position);this.transform.scale.set(...scale);this.transform.rotation.set(0,0,rotation);this.transform.updateMatrix();
        this.mesh.setMatrixAt(this.size,this.transform.matrix);if(color)this.mesh.setColorAt(this.size,color);this.size++;
    }
    commit():void {this.mesh.count=this.size;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;this.mesh.computeBoundingSphere();}
    dispose():void {this.mesh.removeFromParent();this.mesh.dispose();}
}
