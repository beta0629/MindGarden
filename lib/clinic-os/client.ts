import { unstable_cache } from 'next/cache';
import {
  FALLBACK_CONSULTATION_PRODUCTS,
  FALLBACK_HOMEPAGE_CONTENT,
} from './fallback';
import { parseConsultationProductsResponse } from './schemas';
import type {
  ConsultationProduct,
  HomepageContent,
  InquiryPayload,
} from './types';

const REVALIDATE_SECONDS = 300;
/** Never let a cold Clinic-OS round-trip stall HTML for seconds. */
const FETCH_TIMEOUT_MS = 1200;

function getBaseUrl(): string | null {
  const raw = process.env.CLINIC_OS_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function getTenantSlug(): string {
  return process.env.CLINIC_OS_TENANT_SLUG?.trim() || 'mindgarden';
}

function publicPath(suffix: string): string {
  const base = getBaseUrl();
  if (!base) {
    throw new Error('CLINIC_OS_API_BASE_URL is not set');
  }
  return `${base}/api/v1/public/tenants/${getTenantSlug()}${suffix}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Clinic-OS ${res.status} for ${url}`);
  }
  return res.json() as Promise<unknown>;
}

async function loadConsultationProducts(): Promise<ConsultationProduct[]> {
  if (!getBaseUrl()) {
    return FALLBACK_CONSULTATION_PRODUCTS;
  }
  try {
    const raw = await fetchJson(publicPath('/consultation-products'));
    return parseConsultationProductsResponse(raw);
  } catch {
    return FALLBACK_CONSULTATION_PRODUCTS;
  }
}

async function loadHomepageContent(): Promise<HomepageContent> {
  if (!getBaseUrl()) {
    return FALLBACK_HOMEPAGE_CONTENT;
  }
  try {
    const raw = (await fetchJson(
      publicPath('/homepage-content'),
    )) as HomepageContent;
    return raw;
  } catch {
    return FALLBACK_HOMEPAGE_CONTENT;
  }
}

/**
 * Thin typed Clinic-OS public client (server-side only — no CORS).
 * Field-name mapping / validation lives in this module + schemas.ts.
 * Cached + short timeout so homepage TTFB never waits on a cold upstream.
 */
export const clinicOsClient = {
  async getConsultationProducts(): Promise<ConsultationProduct[]> {
    const slug = getTenantSlug();
    return unstable_cache(
      loadConsultationProducts,
      ['clinic-os-consultation-products', slug],
      { revalidate: REVALIDATE_SECONDS },
    )();
  },

  async getHomepageContent(): Promise<HomepageContent> {
    const slug = getTenantSlug();
    return unstable_cache(
      loadHomepageContent,
      ['clinic-os-homepage-content', slug],
      { revalidate: REVALIDATE_SECONDS },
    )();
  },

  async submitInquiry(payload: InquiryPayload): Promise<{ status: number }> {
    if (!getBaseUrl()) {
      if (payload.website) {
        return { status: 202 };
      }
      return { status: 202 };
    }
    const res = await fetch(publicPath('/inquiries'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        phone: payload.phone,
        inquiryType: payload.inquiryType,
        content: payload.content,
        privacyConsent: payload.privacyConsent,
        turnstileToken: payload.turnstileToken,
        website: payload.website ?? '',
      }),
      signal: AbortSignal.timeout(8000),
    });
    return { status: res.status };
  },
};

export type ProductPriceView = {
  /** Amount to emphasize (eventPrice when set, else price). */
  amount: number;
  /** When set, show struck-through alongside amount. */
  struckThroughPrice: number | null;
  isEvent: boolean;
};

/**
 * Show eventPrice when it isn't null (API already drops out-of-window
 * event-only products). Otherwise show price.
 */
export function resolveProductDisplayPrice(
  product: ConsultationProduct,
): ProductPriceView {
  if (product.eventPrice != null) {
    return {
      amount: product.eventPrice,
      struckThroughPrice: product.price,
      isEvent: true,
    };
  }
  return {
    amount: product.price,
    struckThroughPrice: null,
    isEvent: false,
  };
}

/** First product that currently carries an event price (already sorted). */
export function getActiveEventProduct(
  products: ConsultationProduct[],
): ConsultationProduct | null {
  return products.find((p) => p.eventPrice != null) ?? null;
}

/** @deprecated Use getActiveEventProduct */
export function getActiveFirstMindWalk(
  products: ConsultationProduct[],
): ConsultationProduct | null {
  return getActiveEventProduct(products);
}
