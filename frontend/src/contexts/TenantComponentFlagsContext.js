/**
 * 테넌트 활성 컴포넌트 플래그 — 단일 fetch (LNB·게이트·쇼핑 레이아웃)
 *
 * @author Core Solution
 * @since 2026-05-19
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { PLATFORM_COMPONENT_CODES, TENANT_COMPONENT_API } from '../constants/tenantComponentApi';
import { useSession } from './SessionContext';

const TenantComponentFlagsContext = createContext(null);

/**
 * @param {unknown} res
 * @returns {string[]}
 */
function parseActiveComponentCodes(res) {
  if (res == null || typeof res !== 'object') {
    return [];
  }
  const obj = res;
  const data = obj.data ?? obj;
  if (data && typeof data === 'object' && Array.isArray(data.activeComponentCodes)) {
    return data.activeComponentCodes;
  }
  if (Array.isArray(obj.activeComponentCodes)) {
    return obj.activeComponentCodes;
  }
  return [];
}

export const TenantComponentFlagsProvider = ({ children }) => {
  const { isLoggedIn, hasCheckedSession } = useSession();
  const fetchEnabled = isLoggedIn && hasCheckedSession;
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeCodes, setActiveCodes] = useState([]);

  useEffect(() => {
    if (!fetchEnabled) {
      setLoading(false);
      setLoaded(false);
      setActiveCodes([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setLoaded(false);

    StandardizedApi.get(TENANT_COMPONENT_API.ACTIVE_CODES, {}, { unwrapApiEnvelope: false })
      .then((res) => {
        if (!cancelled) {
          setActiveCodes(parseActiveComponentCodes(res));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActiveCodes([]);
        }
      })
      .finally(() => {
        setLoading(false);
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchEnabled]);

  const flagsPending = fetchEnabled && (!loaded || loading);

  const isActive = useMemo(
    () => (code) => {
      if (!code) {
        return false;
      }
      return activeCodes.includes(code);
    },
    [activeCodes]
  );

  const adminShopCatalogEnabled = useMemo(
    () => (flagsPending ? undefined : isActive(PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG)),
    [flagsPending, isActive]
  );

  const clientShopEnabled = useMemo(
    () => (flagsPending ? undefined : isActive(PLATFORM_COMPONENT_CODES.CLIENT_SHOP)),
    [flagsPending, isActive]
  );

  const clientRewardEnabled = useMemo(
    () => (flagsPending ? undefined : isActive(PLATFORM_COMPONENT_CODES.CLIENT_REWARD)),
    [flagsPending, isActive]
  );

  const value = useMemo(
    () => ({
      loading: flagsPending,
      activeCodes,
      isActive,
      adminShopCatalogEnabled,
      clientShopEnabled,
      clientRewardEnabled
    }),
    [
      flagsPending,
      activeCodes,
      isActive,
      adminShopCatalogEnabled,
      clientShopEnabled,
      clientRewardEnabled
    ]
  );

  return (
    <TenantComponentFlagsContext.Provider value={value}>
      {children}
    </TenantComponentFlagsContext.Provider>
  );
};

/**
 * @param {{ enabled?: boolean }} [options] 하위 호환 — Provider가 세션 기준으로 fetch
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
  const context = useContext(TenantComponentFlagsContext);

  if (!context) {
    throw new Error('useTenantComponentFlags must be used within TenantComponentFlagsProvider');
  }

  if (!enabled) {
    return {
      loading: false,
      activeCodes: [],
      isActive: () => false,
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    };
  }

  return context;
}
