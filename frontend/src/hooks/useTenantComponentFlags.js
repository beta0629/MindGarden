/**
 * 테넌트 활성 컴포넌트 플래그 (TenantComponent API)
 *
 * @author Core Solution
 * @since 2026-05-19
 */

import { useEffect, useMemo, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { PLATFORM_COMPONENT_CODES, TENANT_COMPONENT_API } from '../constants/tenantComponentApi';

/**
 * @param {{ enabled?: boolean }} [options] enabled=false이면 API 호출 생략
 * @returns {{
 *   loading: boolean,
 *   activeCodes: string[],
 *   isActive: (code: string) => boolean,
 *   adminShopCatalogEnabled: boolean | undefined,
 *   clientShopEnabled: boolean | undefined,
 *   clientRewardEnabled: boolean | undefined
 * }}
 */
export function useTenantComponentFlags(options = {}) {
  const { enabled = true } = options;
  const [loading, setLoading] = useState(Boolean(enabled));
  const [activeCodes, setActiveCodes] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setActiveCodes(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    StandardizedApi.get(TENANT_COMPONENT_API.ACTIVE_CODES, {}, { unwrapApiEnvelope: false })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const codes = Array.isArray(res?.data?.activeComponentCodes)
          ? res.data.activeComponentCodes
          : [];
        setActiveCodes(codes);
      })
      .catch(() => {
        if (!cancelled) {
          setActiveCodes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const isActive = useMemo(
    () => (code) => {
      if (!code || activeCodes === null) {
        return false;
      }
      return activeCodes.includes(code);
    },
    [activeCodes]
  );

  const adminShopCatalogEnabled = useMemo(() => {
    if (activeCodes === null) {
      return undefined;
    }
    return isActive(PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG);
  }, [activeCodes, isActive]);

  const clientShopEnabled = useMemo(() => {
    if (activeCodes === null) {
      return undefined;
    }
    return isActive(PLATFORM_COMPONENT_CODES.CLIENT_SHOP);
  }, [activeCodes, isActive]);

  const clientRewardEnabled = useMemo(() => {
    if (activeCodes === null) {
      return undefined;
    }
    return isActive(PLATFORM_COMPONENT_CODES.CLIENT_REWARD);
  }, [activeCodes, isActive]);

  return {
    loading,
    activeCodes: activeCodes ?? [],
    isActive,
    adminShopCatalogEnabled,
    clientShopEnabled,
    clientRewardEnabled
  };
}
