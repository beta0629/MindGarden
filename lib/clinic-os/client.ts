import {
  FALLBACK_CONSULTATION_PRODUCTS,
  FALLBACK_HOMEPAGE_CONTENT,
} from './fallback';
import type {
  ConsultationProduct,
  HomepageContent,
  InquiryPayload,
} from './types';

const REVALIDATE_SECONDS = 300;

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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Clinic-OS ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Thin typed Clinic-OS public client.
 * Field-name mapping lives only in this file.
 */
export const clinicOsClient = {
  async getConsultationProducts(): Promise<ConsultationProduct[]> {
    if (!getBaseUrl()) {
      return FALLBACK_CONSULTATION_PRODUCTS;
    }
    try {
      return await fetchJson<ConsultationProduct[]>(
        publicPath('/consultation-products'),
      );
    } catch {
      return FALLBACK_CONSULTATION_PRODUCTS;
    }
  },

  async getHomepageContent(): Promise<HomepageContent> {
    if (!getBaseUrl()) {
      return FALLBACK_HOMEPAGE_CONTENT;
    }
    try {
      return await fetchJson<HomepageContent>(publicPath('/homepage-content'));
    } catch {
      return FALLBACK_HOMEPAGE_CONTENT;
    }
  },

  async submitInquiry(payload: InquiryPayload): Promise<{ status: number }> {
    if (!getBaseUrl()) {
      // Dev / unset API: accept locally so UI can be tested.
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
    });
    return { status: res.status };
  },
};

/** KST calendar date YYYY-MM-DD */
export function kstToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isWithinEventWindow(
  start: string | null,
  end: string | null,
  today = kstToday(),
): boolean {
  if (!start || !end) return false;
  return today >= start && today <= end;
}

export function resolveProductDisplayPrice(product: ConsultationProduct): {
  amount: number | null;
  isEvent: boolean;
  needsConfirm: boolean;
} {
  const inWindow = isWithinEventWindow(
    product.eventStartDate,
    product.eventEndDate,
  );
  if (inWindow && product.eventPrice != null) {
    return { amount: product.eventPrice, isEvent: true, needsConfirm: false };
  }
  if (product.price > 0) {
    return { amount: product.price, isEvent: false, needsConfirm: false };
  }
  return { amount: null, isEvent: false, needsConfirm: true };
}

export function getActiveFirstMindWalk(
  products: ConsultationProduct[],
): ConsultationProduct | null {
  const found = products.find((p) =>
    p.name.includes('첫 마음산책'),
  );
  if (!found) return null;
  if (
    !isWithinEventWindow(found.eventStartDate, found.eventEndDate) ||
    found.eventPrice == null
  ) {
    return null;
  }
  return found;
}
