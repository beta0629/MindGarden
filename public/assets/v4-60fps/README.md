# v4-60fps scene videos (stacked-alpha H.264)

60 fps transparent replacements for the home-v3.7 canvas/atlas motion (hero, gate, bench, booking).
Assets only — no code in this commit uses them yet. `d` = desktop pack (1440), `m` = mobile pack (390).
Per-scene geometry, timings, frame maps and ffprobe data live in each folder's `layout.json` (`hero/hero.json` for hero).

## Files

| Folder | File | Use |
|---|---|---|
| hero | `hero-{d,m}-stack.mp4` | hero butterfly loop, 300 frames / 5.0 s |
| hero | `hero-{d,m}-poster.webp` | decoded frame 0 (LCP still, reduced motion) |
| hero | `hero.json` | sizes, frame count, loop + display metadata |
| gate | `gate-{d,m}-stack.mp4` | gate door opening, plays once (d 119 / m 101 frames) |
| gate | `gate-{d,m}-poster.webp` | decoded frame 0 (door closed) |
| gate | `gate-{d,m}-end-poster.webp` | decoded last frame (= static gate) |
| bench | `bench-{d,m}-back-stack.mp4` | butterflies behind the bench body, 189 frames / 3.15 s |
| bench | `bench-{d,m}-front-stack.mp4` | butterflies in front of the bench body, same clock |
| booking | `booking-{d,m}-landing-stack.mp4` | butterfly landing, 77 frames, plays once |
| booking | `booking-{d,m}-breathe-stack.mp4` | resting wing breathe loop, 132 frames / 2.2 s (ping-pong baked in) |
| booking | `booking-{d,m}-hover-stack.mp4` | hover loop, 96 frames / 1.6 s, wing angle 85° → 73° → 85° (desktop hover) |
| booking | `booking-{d,m}-poster.webp` | decoded landing frame 10 (same frame as the live motion poster) |
| booking | `booking-{d,m}-end-poster.webp` | decoded landing frame 76 (= breathe frame 0) |
| gate, bench, booking | `layout.json` | boxes, padding, timings, frame maps, ffprobe |

Posters are lossy WebP q90 with alpha_quality 100, unpacked from the decoded video with the shader math below,
so a poster → video swap has no pixel jump.

## Stacked-alpha format

Each video frame is twice the display height:

- top half: premultiplied RGB
- bottom half: alpha (grey; read the R channel)

Encoding: H.264 High@L4.2, ref=4, bframes=2, yuv420p, BT.709 primaries/transfer/matrix, TV range
(written in the SPS VUI and the container), 60 fps, `+faststart`, no audio.
Video pixel sizes are multiples of 16 and are not always the box aspect ratio: always display with `object-fit: fill`
into the CSS box given in `layout.json`.

## Decode shader

```glsl
// u: 0..1 UV inside the display box, y down (u.y = 0 at the top edge)
// h: half a texel in v = 0.5 / videoHeight (full stacked height), keeps the top/bottom samples from bleeding across the seam
float y = clamp(u.y * 0.5, h, 0.5 - h);
vec3  c = texture2D(t, vec2(u.x, y)).rgb;          // top half: premultiplied RGB
float a = texture2D(t, vec2(u.x, y + 0.5)).r;      // bottom half: alpha
a = clamp((a - 0.006) / 0.988, 0.0, 1.0);          // decoder noise floor at alpha 0 (TV-range Y=16)
vec2 e = smoothstep(0.0, 0.015, u) * smoothstep(0.0, 0.015, 1.0 - u);
a *= e.x * e.y;                                     // exact 0 alpha on the box edge
gl_FragColor = vec4(min(c, vec3(a)), a);            // premultiplied output (premultipliedAlpha: true)
```

The same 1.5 % edge feather is already baked into the encoded frames,
so the shader edge term removes only decoder noise. Verified on every frame: border ring, corners and
pixels outside the box are 0 (8-bit) against the section background.

## Playback rules

**Hero** — infinite loop (`loop`). Frame 299 → 0 is seamless. Video fills the hero stage box
(`position:absolute; inset:0; width:100%; height:100%; object-fit:fill`), same box as the poster.
At 390 the frame wrapper uses `transform: translateY(-13%) scale(1.059)` (origin 50% 50%) to match the 38d4 framing.

**Gate** — play once, then keep the last frame (or swap to `gate-<k>-end-poster.webp`). The last frame is the
static gate (22-frame tail crossfade into it). Box = gate body layer box in page CSS px (`layout.json` → `bp.<bp>.box_css_page`).

**Bench** — `back` and `front` start together on the same clock, play once, then hide both (last frame is fully transparent;
the last 10 walk frames fade out). Starts 0.567 s after the walk trigger (walk f320 → f337).
Layer order, bottom to top: bench shadow `<img>` → `back` video → bench body `<img>` → `front` video.
The settle (rise) transform applies to the bench images only — the videos are not inside the settle wrapper.
Video box = BenchScene overflow box, including a 4 px safety pad at the bottom (`layout.json` → `overflow_box_css`, `pad_css`, `css_scale_rule`).

**Booking**
- `landing` plays once; on `ended` swap to `breathe` (loop). Landing frame 76 and breathe frame 0 are the same pose.
- If the poster is shown first, start `landing` at `currentTime = 10/60`; without a poster play from 0 (frame 0 is fully transparent).
- Desktop hover: switch to the `hover` loop with a 300 ms opacity crossfade, and crossfade back on leave.
- Desktop (1440) video box extends **8 CSS px above** the place box (`top: -8px; height: 225px` on a 291 × 217 place box),
  so wing tips are not cut by the edge feather. Mobile (390) uses the place box as is (195 × 113).
- 390 clip line: rows below the booking button top + 3 px are already cleared in the video (no CSS clip needed).

## Section backgrounds

- hero, bench: `#F5F0E6` (cream)
- gate, booking: `#EAE2D2` (sand)

## Known issue in 38d4 (not in these videos)

Bench B1 is double-mirrored in 38d4: `drawButterflies()` mirrors the already-mirrored export cell again,
so staging shows B1 un-mirrored. These videos follow the approved composite (B1 mirrored once).
