import Phaser from 'phaser';
// Original local 64px vector drawings rasterized once. All depths are painted facets.
export function createTiles(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const rect = (c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c).fillRect(x, y, w, h);
    const oval = (c: number, x: number, y: number, w: number, h: number) => g.fillStyle(c).fillEllipse(x, y, w, h);
    const poly = (c: number, points: number[]) => g.fillStyle(c).fillPoints(Array.from({ length: points.length / 2 }, (_, i) => new Phaser.Geom.Point(points[i * 2] ?? 0, points[i * 2 + 1] ?? 0)), true);
    const line = (c: number, width: number, points: number[]) => { g.lineStyle(width, c); g.beginPath(); g.moveTo(points[0] ?? 0, points[1] ?? 0); for (let i = 2; i < points.length; i += 2)
        g.lineTo(points[i] ?? 0, points[i + 1] ?? 0); g.strokePath(); };
    const save = (key: string) => { g.generateTexture(key, 64, 64); g.clear(); };
    const palettes: Record<string, readonly [
        number,
        number,
        number,
        number
    ]> = { soil: [0x55382b, 0xc79256, 0xf1c487, 0x9c643e], compacted: [0x573d35, 0xb77850, 0xeab47a, 0x87573e], gravel: [0x3c5157, 0x81a6a0, 0xb8d8be, 0x517776], hard: [0x3d4263, 0x8284b0, 0xbfc2de, 0x5d5b87], bedrock: [0x333e52, 0x697e8a, 0x9baeba, 0x4c5a6d], stone: [0x333e52, 0x697e8a, 0x9baeba, 0x4c5a6d], fragile: [0x775638, 0xe8bf77, 0xffe2a7, 0xb28b53] };
    const terrain = (kind: string, stage: number, ore = false) => {
        const p = palettes[kind] ?? palettes.soil;
        if (!p)
            return;
        const [edge, base, light, shade] = p;
        rect(edge, 0, 0, 64, 64);
        g.fillStyle(base).fillRoundedRect(2, 2, 60, 60, 6);
        poly(light, [4, 4, 59, 4, 53, 10, 10, 10, 5, 21]);
        poly(shade, [59, 5, 62, 11, 62, 60, 5, 62, 10, 54, 53, 54]);
        if (kind === 'soil') {
            oval(shade, 20, 25, 11, 6);
            oval(light, 44, 38, 9, 5);
        }
        if (kind === 'compacted') {
            line(shade, 3, [7, 24, 28, 27, 55, 23]);
            line(light, 2, [8, 43, 35, 39, 55, 42]);
        }
        if (kind === 'gravel') {
            poly(shade, [10, 17, 22, 13, 29, 23, 22, 31, 11, 28]);
            poly(light, [34, 36, 45, 29, 55, 36, 51, 47, 39, 49]);
        }
        if (kind === 'hard') {
            poly(shade, [7, 32, 22, 10, 41, 12, 58, 30, 46, 52, 24, 55]);
            poly(base, [14, 31, 25, 16, 39, 19, 49, 31, 40, 45, 24, 46]);
            line(light, 2, [18, 29, 27, 19, 38, 21]);
        }
        if (kind === 'bedrock' || kind === 'stone') {
            line(edge, 3, [2, 32, 62, 32]);
            line(edge, 3, [26, 3, 26, 31]);
            line(edge, 3, [45, 33, 45, 61]);
        }
        if (kind === 'fragile')
            line(edge, 4, [33, 4, 27, 21, 39, 31, 25, 45, 30, 62]);
        if (ore) {
            for (const [x, y] of [[17, 22], [43, 39], [40, 16]]) {
                oval(edge, x ?? 0, (y ?? 0) + 3, 21, 17);
                poly(0xe9a328, [(x ?? 0) - 8, y ?? 0, (x ?? 0) - 3, (y ?? 0) - 7, (x ?? 0) + 7, (y ?? 0) - 5, (x ?? 0) + 10, (y ?? 0) + 5, (x ?? 0) - 3, (y ?? 0) + 7]);
                poly(0xffdf69, [(x ?? 0) - 7, y ?? 0, (x ?? 0) - 2, (y ?? 0) - 6, (x ?? 0) + 6, (y ?? 0) - 4, (x ?? 0) + 2, y ?? 0]);
            }
        }
        if (stage > 0) {
            line(edge, 2.5, [31, 4, 27, 20, 36, 29, 26, 40]);
            if (stage > 1)
                line(edge, 3, [35, 28, 49, 25, 59, 35]);
            if (stage > 2)
                line(edge, 3, [27, 39, 17, 49, 21, 61]);
        }
    };
    for (const kind of Object.keys(palettes))
        for (let stage = 0; stage < 4; stage++) {
            terrain(kind, stage);
            save('terrain-' + kind + '-' + stage);
        }
    for (const [hardness, kind] of [[1, 'soil'], [2, 'compacted'], [3, 'gravel'], [5, 'hard']] as const)
        for (let stage = 0; stage < 4; stage++) {
            terrain(kind, stage, true);
            save('terrain-ore-' + hardness + '-' + stage);
        }
    rect(0x493e43, 0, 0, 64, 64);
    poly(0x4e4347, [2, 2, 62, 2, 55, 12, 12, 12, 4, 55]);
    poly(0x443a40, [64, 10, 64, 64, 4, 64, 12, 57, 56, 57]);
    save('terrain-empty');
    // Ladders and platforms remain distinct from the solid terrain.
    for (const x of [13, 47]) {
        rect(0x533c2c, x + 2, 0, 6, 64);
        rect(0xbe8b52, x, 0, 6, 64);
        rect(0xf1cf8a, x, 0, 2, 64);
    }
    for (let y = 8; y < 64; y += 19) {
        rect(0x654730, 17, y + 3, 34, 6);
        rect(0xe5b975, 16, y, 33, 6);
        rect(0xffdfa2, 16, y, 33, 2);
    }
    save('ladder');
    rect(0x563d31, 0, 0, 64, 14);
    rect(0xd6a462, 0, 0, 64, 8);
    rect(0xffdb91, 1, 0, 62, 3);
    for (let x = 3; x < 64; x += 16) {
        rect(0x805333, x, 4, 2, 7);
        oval(0x65544b, x + 7, 5, 3, 3);
    }
    poly(0x93613f, [5, 14, 12, 14, 12, 24]);
    poly(0x93613f, [52, 14, 60, 14, 52, 24]);
    save('platform');
    poly(0x293845, [12, 7, 43, 4, 59, 20, 61, 44, 47, 59, 16, 61, 3, 43, 3, 24]);
    poly(0x8998a2, [13, 10, 42, 8, 55, 22, 55, 43, 44, 55, 17, 56, 8, 41, 8, 25]);
    poly(0xc1cbd0, [13, 10, 42, 8, 48, 16, 22, 18, 8, 32, 8, 25]);
    poly(0x5a6c7c, [49, 22, 55, 22, 55, 43, 44, 55, 17, 56, 16, 49, 40, 47]);
    line(0x455361, 4, [31, 15, 26, 28, 36, 33, 29, 45]);
    save('boulder');
    poly(0x11535f, [18, 8, 45, 8, 59, 27, 32, 58, 5, 27]);
    poly(0x40ced2, [19, 11, 44, 11, 54, 27, 32, 52, 10, 27]);
    poly(0xc1fff1, [19, 11, 31, 11, 22, 26, 10, 27]);
    poly(0x198ca5, [39, 27, 54, 27, 32, 52]);
    poly(0x87f4e2, [22, 26, 39, 27, 32, 47]);
    save('gem');
    g.fillStyle(0x264d43).fillRoundedRect(5, 2, 54, 62, 9);
    g.fillStyle(0x9fd287).fillRoundedRect(8, 2, 48, 59, 7);
    g.fillStyle(0x396357).fillRoundedRect(17, 12, 30, 49, 9);
    rect(0xc5e89d, 9, 3, 46, 5);
    poly(0xffdc77, [28, 26, 38, 33, 28, 40, 28, 36, 21, 36, 21, 30, 28, 30]);
    rect(0x614832, 4, 57, 56, 6);
    save('exit');
    const mole = (frame: number, mode: 'walk' | 'dig' | 'idle' | 'fall') => {
        const phase = Math.sin(frame * Math.PI / 3), step = mode === 'walk' ? phase * 4 : 0, reach = mode === 'dig' ? phase * 7 : 0;
        oval(0x342d37, 30, 58, 45, 8);
        oval(0x5d4546, 28, 36, 40, 45);
        oval(0x8f6860, 25, 33, 33, 39);
        oval(0xb58a77, 31, 39, 23, 29);
        oval(0x654849, 18, 14, 14, 16);
        oval(0xd6a098, 18, 14, 8, 10);
        oval(0x9e7567, 36, 27, 35, 31);
        oval(0xe8b3a0, 49, 34, 20, 15);
        oval(0xd57c8f, 56, 31, 11, 10);
        oval(0xf3bcc1, 55, 29, 5, 3);
        oval(0x352e39, 40, 24, 8, 10);
        oval(0xfff4d9, 41, 22, 3, 3);
        oval(0x654849, 19, 55 + step, 16, 11);
        oval(0xd2aa8c, 19, 53 + step, 13, 7);
        oval(0x654849, 38, 55 - step, 16, 11);
        oval(0xd2aa8c, 38, 53 - step, 13, 7);
        g.fillStyle(0x348f90).fillRoundedRect(13, 39, 24, 7, 3);
        poly(0x267273, [13, 43, 13, 54, 20, 49, 21, 44]);
        oval(0xe1b498, 44 + reach, 43 + (mode === 'fall' ? -8 : 0), 17, 11);
        for (let i = 0; i < 3; i++)
            line(0xffe4bc, 1.5, [44 + reach + i * 3, 43, 46 + reach + i * 3, 47]);
        g.fillStyle(0xb57b32).fillRoundedRect(13, 4, 36, 12, 6);
        g.fillStyle(0xf1bc4c).fillRoundedRect(14, 2, 33, 11, 7);
        rect(0xffd76b, 10, 11, 41, 5);
        oval(0x5c656e, 39, 9, 12, 12);
        oval(0xffe8a7, 40, 8, 8, 8);
        oval(0xfff5d7, 39, 7, 3, 3);
    };
    for (const mode of ['walk', 'dig', 'idle', 'fall'] as const)
        for (let frame = 0; frame < 6; frame++) {
            mole(frame, mode);
            save('mole-' + mode + '-' + frame);
        }
    g.destroy();
}
