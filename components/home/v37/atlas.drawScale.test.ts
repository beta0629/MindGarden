import { describe, expect, it, vi } from 'vitest';
import {
  drawAtlasFrame,
  frameDisplaySize,
  sheetDisplaySize,
  targetDecodeSizeFromHint,
  __resetSoftwareGpuCacheForTests,
} from './atlas';
import type { AtlasMeta } from './types';

function makeAtlas(): AtlasMeta {
  return {
    frame_w: 100,
    frame_h: 50,
    frames: 1,
    cols: 1,
    gutter: 0,
    sheets: [{ file: 'x.webp', bytes: 1, w: 200, h: 100 }],
    index: [[0, 40, 20]],
  };
}

describe('sheetDisplaySize / frameDisplaySize', () => {
  it('divides sheet dims by sourceScale and keeps natural for single-pass decode', () => {
    expect(sheetDisplaySize(200, 100, 2)).toEqual({
      displayW: 100,
      displayH: 50,
      naturalW: 200,
      naturalH: 100,
    });
    expect(sheetDisplaySize(200, 100, 1)).toEqual({
      displayW: 200,
      displayH: 100,
      naturalW: 200,
      naturalH: 100,
    });
  });

  it('divides frame dims by sourceScale for CSS dest', () => {
    expect(frameDisplaySize(makeAtlas(), 2)).toEqual({ cssW: 50, cssH: 25 });
    expect(frameDisplaySize(makeAtlas(), 1)).toEqual({ cssW: 100, cssH: 50 });
  });

  it('targetDecodeSizeFromHint uses natural meta without decoding', () => {
    __resetSoftwareGpuCacheForTests();
    // Force DPR path via software GPU cache false — effectiveCanvasDpr min 1.
    const hint = sheetDisplaySize(2000, 1000, 2);
    const target = targetDecodeSizeFromHint(hint);
    expect(target).not.toBeNull();
    expect(target!.naturalW).toBe(2000);
    expect(target!.naturalH).toBe(1000);
    // display 1000×500 × dpr(≥1) < natural → resize planned.
    expect(target!.w).toBeLessThan(2000);
    expect(target!.h).toBeLessThan(1000);
  });
});

describe('drawAtlasFrame bitmapScale', () => {
  it('uses natural source rects when bitmapScale is 1', () => {
    const calls: unknown[][] = [];
    const ctx = {
      drawImage: vi.fn((...args: unknown[]) => {
        calls.push(args);
      }),
    } as unknown as CanvasRenderingContext2D;
    const sheet = { width: 200, height: 100 } as unknown as ImageBitmap;

    drawAtlasFrame(ctx, sheet, makeAtlas(), 0, 0, 0, 2, 1);

    expect(calls[0]?.slice(1, 5)).toEqual([40, 20, 100, 50]);
    expect(calls[0]?.slice(5)).toEqual([0, 0, 50, 25]);
  });

  it('multiplies source rects by bitmapScale when sheet was resized', () => {
    const calls: unknown[][] = [];
    const ctx = {
      drawImage: vi.fn((...args: unknown[]) => {
        calls.push(args);
      }),
    } as unknown as CanvasRenderingContext2D;
    const sheet = { width: 100, height: 50 } as unknown as ImageBitmap;

    // Decode at half scale (DPR1, sourceScale 2 → display = natural/2).
    drawAtlasFrame(ctx, sheet, makeAtlas(), 0, 0, 0, 2, 0.5);

    expect(calls[0]?.slice(1, 5)).toEqual([20, 10, 50, 25]);
    // Dest CSS size unchanged (frame_w/sourceScale).
    expect(calls[0]?.slice(5)).toEqual([0, 0, 50, 25]);
  });

  it('keeps UV/dest consistency: scale 0.5 maps half-sheet UVs to same CSS dest', () => {
    const atlas = makeAtlas();
    const sourceScale = 2;
    const bitmapScale = 0.5;
    const { cssW, cssH } = frameDisplaySize(atlas, sourceScale);
    const entry = atlas.index[0]!;
    const sx = entry[1] * bitmapScale;
    const sy = entry[2] * bitmapScale;
    const sw = atlas.frame_w * bitmapScale;
    const sh = atlas.frame_h * bitmapScale;
    expect(sx).toBe(20);
    expect(sy).toBe(10);
    expect(sw).toBe(50);
    expect(sh).toBe(25);
    expect(cssW).toBe(50);
    expect(cssH).toBe(25);
  });
});
