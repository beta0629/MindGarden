# Raster image inventory (homepage renewal)

Sources are center-provided photos (재학/센터 소유), official blog/YouTube thumbs, VectorCraft icons, or the self-made 3D hero still. No stock / AI people-or-space photos are used in the live UI.

## Hero (home)

| Public path | Source file | Notes |
|---|---|---|
| `/images/hero-orbit-still.png` (+ `.webp`) | v2-home design orbit still (`SOURCES.md`: `v1.3-home/motion/orbit/frames/o_0000.png`); exported from `v2-home/home-1440-v2-viewport.png` in this checkout | Self-made 3D butterfly + flowers. Orbit video not bundled → still only. |

**Removed / not used in UI:** legacy `assets/images/hero.png` (abstract teal render), AI Veo people clip `public/assets/videos/ADHD_Counseling_Center_Video_Generation.mp4` (was copied to `/videos/hero-video.mp4`).

## Home — 센터 공간 / event / news

| Public path | Source (v2-home `images/SOURCES.md`) |
|---|---|
| `/images/space-1-sandplay-c73-16x9.jpg` | center-73.jpeg |
| `/images/space-2-art-c109-4x3.jpg` | center-109.jpeg (caption 시안 배정, `[확인 필요]`) |
| `/images/space-3-play-c122-4x3.jpg` | center-122.jpeg |
| `/images/space-4-language-c112-4x3.jpg` | center-112.jpeg (caption 시안 배정, `[확인 필요]`) |
| `/images/space-5-family-c163-4x3.jpg` | center-163.jpeg (caption 시안 배정, `[확인 필요]`) |
| `/images/banner-flowers-c64-3x2.jpg` / `…-1x1.jpg` | center-64.jpeg (CSS event banner + Clinic-OS fallback) |
| `/images/yt-*-16x9.jpg` | YouTube maxresdefault (센터 채널) |
| `/images/blog-*-4x3.jpg` | Naver blog og:image (trinity_2012) |

Placeholders (no raster): 대표원장 사진, 지도 미리보기.

## Subpages

| Page | Public path | Source |
|---|---|---|
| `/about` | `about-hero-lobby-c148-16x9.jpg`, `about-space-sandplay-c145-16x9.jpg`, `about-space-play-c171-4x3.jpg`, `about-space-waiting-c154-4x3.jpg` | subpages-v1.1 shared crops from center photos |
| `/about`, `/counselors` | — | Placeholder: 김선희 대표원장 사진 |
| `/counseling/[slug]` | `counseling-detail-play-c127-4x3.jpg`, `detail-adults-monstera-c167-4x3.jpg`, `detail-overlap-plants-c132-4x3.jpg`, `detail-family-flowers-c147-4x3.jpg` | center crops (subpages-v1.1) |
| `/gallery` | `gallery-hero-sandplay-c73-4x3.jpg`, `gallery-*-3x4.jpg` | center crops |
| `/guide` | `guide-hero-lounge-c152-16x9.jpg` | center-152 |
| `/event` | `event-hero-flowers-c64-16x9.jpg` | center-64 |
| `/faq` | `faq-flowers-c64-4x1.jpg` | center-64 |
| `/contact` | `contact-corner-c161-4x3.jpg` | center-161 |
| `/reviews` | `reviews-band-flowers-c147-6x1.jpg` | center-147 |
| `/videos` | `yt-*-16x9.jpg` (fallback) + Clinic-OS thumbs when available | YouTube |
| `/blog` | `blog-*-4x3.jpg` (fallback) | blog og:image |
| `/location` | icons only for transit; **건물 외관 / 입구·간판 / 지도** = labeled placeholders | exterior/entrance/map not shown as photos |

## Brand / icons (not photo rasters)

- `/brand/logo.svg` (butterfly master, trimmed viewBox), `/brand/logo.png`, `/brand/og-default.png`, `/favicon.png`
- Hero motion: `/assets/hero/hero-butterfly.glb`, `hero-orbit-loop.{webm,mp4}`, `hero-poster.webp` (+ width variants)
- `/icons/area-*.svg`, `/icons/step-*.svg`, `/icons/loc-*.svg` (v2-home VectorCraft)

## assets-v1 (앱웹 디자인 팩, self-made)

Source pack: `uploads/assets-v1-web.tar.gz` → `public/illustrations/*` (+ icon SVGs mirrored to `public/icons/`).  
Provenance: **self-made, 앱웹 디자인 assets-v1**. Docs: `design-refs/assets-v1/`.

| Public path | Role | Notes |
|---|---|---|
| `/icons/{area,step,loc,contact-*}*.svg` | Area×4, step×4, location×3, phone×1 | Pack SVG (byte-identical re-export) |
| `/illustrations/icon-*@2x.{webp,avif}` | Icon raster fallbacks | Not required when SVG is used |
| `/illustrations/not-found-4x3@2x.{webp,avif}` | 404 desktop 480×360 | Cream only |
| `/illustrations/not-found-1x1@2x.{webp,avif}` | 404 mobile 280×280 | Cream only |
| `/illustrations/empty-{reviews,event-off,generic}.{svg,+@2x webp/avif}` | Empty states 160×160 | Cream only; Clinic-OS empty |
| `/illustrations/divider-sprig.{svg,+@2x webp/avif}` | Section divider 240×32 | Cream only |
| `event-visual-*` | — | **Excluded from build** (keep lobby flower photo) |

