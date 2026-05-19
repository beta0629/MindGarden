/**
 * 쇼핑몰 카탈로그 썸네일 — 생성형 placeholder·표시 URL 해석 (웹 shopCatalogThumbnail.js 패리티)
 *
 * @author MindGarden
 * @since 2026-05-20
 */

import {
  SHOP_CATALOG_CATEGORY,
  SHOP_CATALOG_PLACEHOLDER_SIZE_PX,
  SHOP_CATALOG_PLACEHOLDER_SVG_COLORS,
  SHOP_CATALOG_PLACEHOLDER_TITLE_FALLBACK,
  SHOP_CATEGORY_TABS,
  normalizeShopCatalogCategory,
  type ShopCatalogCategory,
} from '@/constants/clientShopConstants';
import { toDisplayString } from '@/utils/toDisplayString';

export const SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH =
  '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png';

const PLACEHOLDER_MAX_LINES = 2;
const PLACEHOLDER_MAX_CHARS_PER_LINE = 16;

function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function splitShopCatalogPlaceholderTitleLines(title?: string | null): string[] {
  const raw = toDisplayString(title, SHOP_CATALOG_PLACEHOLDER_TITLE_FALLBACK).trim();
  if (!raw) {
    return [SHOP_CATALOG_PLACEHOLDER_TITLE_FALLBACK];
  }
  const words = raw.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= PLACEHOLDER_MAX_CHARS_PER_LINE) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current =
        word.length > PLACEHOLDER_MAX_CHARS_PER_LINE
          ? word.slice(0, PLACEHOLDER_MAX_CHARS_PER_LINE)
          : word;
    } else {
      lines.push(word.slice(0, PLACEHOLDER_MAX_CHARS_PER_LINE));
      current = '';
    }
    if (lines.length >= PLACEHOLDER_MAX_LINES) {
      break;
    }
  }
  if (current && lines.length < PLACEHOLDER_MAX_LINES) {
    lines.push(current);
  }
  if (lines.length === 0) {
    return [raw.slice(0, PLACEHOLDER_MAX_CHARS_PER_LINE)];
  }
  return lines.slice(0, PLACEHOLDER_MAX_LINES);
}

export function isShopCatalogPlaceholderUrl(url?: string | null): boolean {
  const u = toDisplayString(url, '').trim();
  if (!u) {
    return false;
  }
  if (u === SHOP_CATALOG_DEFAULT_PLACEHOLDER_PATH) {
    return true;
  }
  return u.endsWith('placeholder-dev-consult-demo.png');
}

export function generateShopCatalogPlaceholderDataUri(options: {
  title?: string | null;
  catalogCategory?: string | null;
} = {}): string {
  const categoryKey = normalizeShopCatalogCategory(options.catalogCategory);
  const palette =
    SHOP_CATALOG_PLACEHOLDER_SVG_COLORS[categoryKey] ??
    SHOP_CATALOG_PLACEHOLDER_SVG_COLORS[SHOP_CATALOG_CATEGORY.CONSULTATION];
  const categoryLabel =
    SHOP_CATEGORY_TABS.find((tab) => tab.key === categoryKey)?.label ?? categoryKey;
  const lines = splitShopCatalogPlaceholderTitleLines(options.title);
  const size = SHOP_CATALOG_PLACEHOLDER_SIZE_PX;
  const lineHeight = 36;
  const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;

  const titleTspans = lines
    .map((line, idx) => {
      const dy = idx === 0 ? 0 : lineHeight;
      return `<tspan x="50%" dy="${dy}" text-anchor="middle">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(categoryLabel)}">
  <rect width="100%" height="100%" fill="${palette.background}"/>
  <rect x="24" y="24" width="${size - 48}" height="8" rx="4" fill="${palette.accent}" opacity="0.35"/>
  <text x="50%" y="${startY}" fill="${palette.text}" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="600">${titleTspans}</text>
  <text x="50%" y="${size - 40}" fill="${palette.accent}" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="500" text-anchor="middle">${escapeXml(categoryLabel)}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function isUsableCatalogImageUrl(url?: string | null): boolean {
  const u = toDisplayString(url, '').trim();
  return Boolean(u) && !isShopCatalogPlaceholderUrl(u);
}

export type ShopCatalogImageSku = {
  thumbnailUrl?: string | null;
  heroImageUrl?: string | null;
  title?: string | null;
  catalogCategory?: string | null;
};

export function resolveShopCatalogDisplayImageUrl(
  sku?: ShopCatalogImageSku | null,
): string {
  if (!sku || typeof sku !== 'object') {
    return generateShopCatalogPlaceholderDataUri({});
  }
  const thumbnail = toDisplayString(sku.thumbnailUrl, '').trim();
  const hero = toDisplayString(sku.heroImageUrl, '').trim();
  if (isUsableCatalogImageUrl(thumbnail)) {
    return thumbnail;
  }
  if (isUsableCatalogImageUrl(hero)) {
    return hero;
  }
  return generateShopCatalogPlaceholderDataUri({
    title: sku.title,
    catalogCategory: sku.catalogCategory as ShopCatalogCategory | undefined,
  });
}
