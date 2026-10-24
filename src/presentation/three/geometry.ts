import { ShaderMaterial, BoxGeometry, BufferGeometry, Float32BufferAttribute, SphereGeometry, CylinderGeometry, ConeGeometry, MeshPhongMaterial, MeshBasicMaterial, Material, Color, IcosahedronGeometry, CircleGeometry, DataTexture, RGBAFormat, RepeatWrapping, LinearFilter, AdditiveBlending } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {VISUAL} from './coordinates';

/** Rounded edges remain inside an exact square XY footprint; one low-poly bevel segment. */
export function beveledBox(width: number, height: number, depth: number, bevel: number): BufferGeometry {
    const geometry = new RoundedBoxGeometry(width,height,depth,1,bevel);geometry.computeBoundingBox();
    return geometry;
}
export class Resources {
    readonly clayTexture=clayTexture();
    readonly clayNormals=clayNormals(this.clayTexture);
    readonly glowTexture=goldGlow();
    readonly tiles = [3.1,3.5,3.3,3.2].map((bevel,index)=>{
        const g=beveledBox(32,32,VISUAL.depth,bevel);g.translate(0,0,-VISUAL.depth/2);
        const p=g.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getZ(i)>-1&&Math.abs(p.getX(i))<11&&Math.abs(p.getY(i))<11)p.setZ(i,p.getZ(i)-(.2+.18*index)*(1+Math.sin(p.getX(i)*.4+p.getY(i)*.3+index)));
        // Keep RoundedBoxGeometry's smooth bevel normals after shallow face relief.
        // Recomputing non-indexed normals would turn every bevel into a flat strip.
        g.setAttribute('color',new Float32BufferAttribute(Array.from({length:p.count*3},()=>1),3));g.computeBoundingBox();return g;
    });
    readonly oreTiles=this.tiles.map(sculptOre);
    readonly tile = this.tiles[0] as BufferGeometry;
    readonly sphere = new SphereGeometry(1,12,8);
    readonly facet = new IcosahedronGeometry(1,0);
    readonly boulder=facetedBoulder();
    readonly disc = new CircleGeometry(1,10);
    readonly inset = beveledBox(25,25,2,1.5);
    readonly box = new BoxGeometry(1,1,1);
    readonly rail = new CylinderGeometry(1.5,1.5,32,7);
    readonly rung = new CylinderGeometry(1.25,1.25,21,7);
    readonly plank = beveledBox(32,6,7,1);
    readonly claw = new ConeGeometry(.65,2.5,7);
    readonly materials = new Map<string,Material>();
    terrainMaterial():MeshPhongMaterial {let m=this.materials.get('terrain');if(!m){m=new MeshPhongMaterial({color:'#ffffff',vertexColors:true,map:this.clayTexture,normalMap:this.clayNormals,shininess:28,specular:'#92614a'});this.materials.set('terrain',m);}return m as MeshPhongMaterial;}
    matte(color: number|string): MeshPhongMaterial {
        const key='lit'+color;let mat=this.materials.get(key);
        if(!mat){mat=new MeshPhongMaterial({color,shininess:28,specular:'#654737'});this.materials.set(key,mat);}return mat as MeshPhongMaterial;
    }
    gold():MeshPhongMaterial {const mat=this.matte('#ffcf1d');mat.shininess=90;mat.specular.set('#fff9db');mat.emissive.set('#ffab13');mat.emissiveIntensity=.45;return mat;}
    fogEdge():ShaderMaterial {
        let m=this.materials.get('fog-edge');if(!m){m=new ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tint:{value:new Color('#29191d')}},
            vertexShader:'varying vec2 localUV; varying vec3 masks; void main(){localUV=uv;masks=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',
            fragmentShader: `uniform vec3 tint; varying vec2 localUV; varying vec3 masks;
                float flag(float n,float bit){return mod(floor(n/bit),2.0);}
                void main(){vec2 p=localUV;float n=floor(masks.r*15.0+.5),d=floor(masks.g*15.0+.5);
                float a=max(max(flag(n,1.0)*(1.0-smoothstep(0.0,.28,p.x)),flag(n,2.0)*smoothstep(.72,1.0,p.x)),max(flag(n,4.0)*smoothstep(.72,1.0,p.y),flag(n,8.0)*(1.0-smoothstep(0.0,.28,p.y))));
                a=max(a,flag(d,1.0)*(1.0-smoothstep(0.0,.38,length(p-vec2(0.0,1.0)))));
                a=max(a,flag(d,2.0)*(1.0-smoothstep(0.0,.38,length(p-vec2(1.0,1.0)))));
                a=max(a,flag(d,4.0)*(1.0-smoothstep(0.0,.38,length(p))));
                a=max(a,flag(d,8.0)*(1.0-smoothstep(0.0,.38,length(p-vec2(1.0,0.0)))));
                gl_FragColor=vec4(tint,a);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
                }`});this.materials.set('fog-edge',m);}return m as ShaderMaterial;
    }
    glow():MeshBasicMaterial {const m=this.flat('#ffffff',.72);m.map=this.glowTexture;m.blending=AdditiveBlending;return m;}
    flat(color: number|string,opacity=1): MeshBasicMaterial {
        const key='flat'+color+':'+opacity;let mat=this.materials.get(key);
        if(!mat){mat=new MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});this.materials.set(key,mat);}return mat as MeshBasicMaterial;
    }
    dispose():void { for(const g of [...this.tiles,...this.oreTiles,this.boulder,this.sphere,this.facet,this.disc,this.inset,this.box,this.rail,this.rung,this.plank,this.claw])g.dispose();for(const m of this.materials.values())m.dispose();this.clayTexture.dispose();this.clayNormals.dispose();this.glowTexture.dispose(); }
}
export const TERRAIN_COLORS = { soil:'#c96a37', compacted:'#9e442c', gravel:'#927db5', hard:'#655179', stone:'#8b76aa', bedrock:'#4b3044', fragile:'#c99167', ore_soil:'#873c24', empty:'#302029' };
export function variation(color: string, index: number): Color { return new Color(color).multiplyScalar(.97+(index*17%7)*.01); }
/** Uneven shared vertices retain a nearly spherical silhouette and flat rock facets. */
function facetedBoulder():BufferGeometry {
    const g=new IcosahedronGeometry(1,1),p=g.getAttribute('position');
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),radius=.91+.07*Math.sin(x*17+y*23+z*31);p.setXYZ(i,x*radius,y*radius,z*radius);}
    g.computeVertexNormals();g.computeBoundingBox();return g;
}
/** Replace only the flat front with a shallow, continuous soil bowl; keep every side/back face. */
function sculptOre(base:BufferGeometry):BufferGeometry {
    const p=base.getAttribute('position'),n=base.getAttribute('normal'),uv=base.getAttribute('uv');
    const positions:number[]=[],normals:number[]=[],colors:number[]=[],uvs:number[]=[];let inner=0;
    for(let i=0;i<p.count;i+=3){
        if([0,1,2].every(j=>n.getZ(i+j)>.999&&Math.abs(p.getZ(i+j))<.01)){inner=Math.max(inner,Math.abs(p.getX(i)),Math.abs(p.getY(i)));continue;}
        for(let j=0;j<3;j++){positions.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));normals.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));uvs.push(uv.getX(i+j),uv.getY(i+j));colors.push(1,1,1);}
    }
    const axis=[-inner,-10,-5,0,5,10,inner];
    const vertex=(x:number,y:number)=>{const q=Math.max(0,1-(x*x+y*y)/169),dx=10.4*q*x/169,dy=10.4*q*y/169,len=Math.hypot(dx,dy,1),shade=1-.4*q;positions.push(x,y,-2.6*q*q);normals.push(-dx/len,-dy/len,1/len);uvs.push(x/32+.5,y/32+.5);colors.push(shade,shade*.96,shade*.88);};
    for(let y=0;y<axis.length-1;y++)for(let x=0;x<axis.length-1;x++){const a=axis[x]??0,b=axis[x+1]??0,c=axis[y]??0,d=axis[y+1]??0;vertex(a,c);vertex(b,c);vertex(a,d);vertex(b,c);vertex(b,d);vertex(a,d);}
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('normal',new Float32BufferAttribute(normals,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.computeBoundingBox();return g;
}

/** Original baked clay grain. Shared tiny texture, no DOM, network or external art. */
function clayTexture():DataTexture {
    const size=96,data=new Uint8Array(size*size*4);let seed=1937;
    const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const coarse=Array.from({length:64},noise);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const ix=Math.floor(x/12),iy=Math.floor(y/12);let first=Infinity,second=Infinity,nearest=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=ix+dx,cy=iy+dy,index=((cy+8)%8)*8+(cx+8)%8,jitter=coarse[index]??.5,other=coarse[(index+17)%64]??.5,d=Math.hypot(x-(cx+.2+jitter*.6)*12,y-(cy+.2+other*.6)*12);if(d<first){second=first;first=d;nearest=index;}else if(d<second)second=d;}
        const gap=second-first,ridge=gap<.65?12*(1-gap/.65):0;
        const value=Math.round(198+(coarse[nearest]??.5)*29+Math.min(3,gap)*3-ridge+(noise()-.5)*5),i=(y*size+x)*4;
        data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
    }
    const t=new DataTexture(data,size,size,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.magFilter=t.minFilter=LinearFilter;t.needsUpdate=true;return t;
}
function goldGlow():DataTexture {
    const size=32,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5),i=(y*size+x)*4;data[i]=255;data[i+1]=143;data[i+2]=15;data[i+3]=Math.round(175*Math.max(0,1-r)**1.6);}
    const t=new DataTexture(data,size,size,RGBAFormat);t.magFilter=t.minFilter=LinearFilter;t.needsUpdate=true;return t;
}
function clayNormals(texture:DataTexture):DataTexture {
    const size=96,source=texture.image.data as Uint8Array,data=new Uint8Array(size*size*4);
    const h=(x:number,y:number)=>(source[(((y+size)%size)*size+(x+size)%size)*4]??220)/255;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=(h(x-1,y)-h(x+1,y))*2.2,dy=(h(x,y-1)-h(x,y+1))*2.2,len=Math.hypot(dx,dy,1),i=(y*size+x)*4;data[i]=Math.round((dx/len*.5+.5)*255);data[i+1]=Math.round((dy/len*.5+.5)*255);data[i+2]=Math.round((1/len*.5+.5)*255);data[i+3]=255;}
    const t=new DataTexture(data,size,size,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.magFilter=t.minFilter=LinearFilter;t.needsUpdate=true;return t;
}


