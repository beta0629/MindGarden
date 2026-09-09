/**
 * 공개 by-subdomain 으로 테넌트 merchantLegal 을 조회한다 (로그인·가입 전용).
 * 대용량 약관 문구는 MMKV 에 넣지 않고 마운트마다 in-memory fetch.
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/api/client';
import { TENANT_API } from '@/api/endpoints';
import { useTenantStore } from '@/stores/useTenantStore';
import {
  EMPTY_MERCHANT_LEGAL,
  extractMerchantLegalFromTenantPayload,
  pickTenantFromBySubdomainResponse,
  type MerchantLegalFields,
} from '@/utils/merchantLegal';

export type UseMerchantLegalResult = {
  readonly legal: MerchantLegalFields;
  readonly centerName: string;
  readonly loading: boolean;
  readonly tenantCode: string | null;
};

/**
 * tenantCode 가 스토어에 있으면 BY_SUBDOMAIN 으로 merchantLegal 을 로드한다.
 *
 * @returns legal · centerName · loading · tenantCode
 */
export function useMerchantLegal(): UseMerchantLegalResult {
  const tenantCode = useTenantStore((s) => s.tenantCode);
  const tenantName = useTenantStore((s) => s.tenantName);
  const [legal, setLegal] = useState<MerchantLegalFields>({ ...EMPTY_MERCHANT_LEGAL });
  const [centerName, setCenterName] = useState(() => (tenantName ?? '').trim());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = tenantCode?.trim() ?? '';
    if (!code) {
      setLegal({ ...EMPTY_MERCHANT_LEGAL });
      setCenterName((tenantName ?? '').trim());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const response = await apiGet<unknown>(TENANT_API.BY_SUBDOMAIN, {
          subdomain: code,
        });
        if (cancelled) {
          return;
        }
        const tenant = pickTenantFromBySubdomainResponse(response);
        if (tenant == null) {
          setLegal({ ...EMPTY_MERCHANT_LEGAL });
          setCenterName((tenantName ?? '').trim());
          return;
        }
        const nameFromApi =
          typeof (tenant as { name?: unknown }).name === 'string'
            ? String((tenant as { name: string }).name).trim()
            : '';
        setLegal(extractMerchantLegalFromTenantPayload(tenant));
        setCenterName(nameFromApi || (tenantName ?? '').trim());
      } catch {
        if (!cancelled) {
          setLegal({ ...EMPTY_MERCHANT_LEGAL });
          setCenterName((tenantName ?? '').trim());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantCode, tenantName]);

  return { legal, centerName, loading, tenantCode };
}
