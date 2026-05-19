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
import { getTenantId } from '../utils/apiHeaders';
import { PLATFORM_COMPONENT_CODES, TENANT_COMPONENT_API } from '../constants/tenantComponentApi';
import { useSession } from './SessionContext';

const TenantComponentFlagsContext = createContext(null);

const ACTIVE_CODES_RETRY_DELAY_MS = 400;

/**
 * unwrapApiEnvelope: false 응답 — ApiResponse { success, data: { activeComponentCodes } }
 *
 * @param {unknown} res
 * @returns {{ codes: string[] | null, fetchFailed: boolean }}
 */
export function parseActiveComponentCodesResponse(res) {
  if (res == null) {
    return { codes: null, fetchFailed: true };
  }
  if (typeof res !== 'object') {
    return { codes: null, fetchFailed: true };
  }

  const obj = /** @type {Record<string, unknown>} */ (res);

  if (obj.success === false) {
    return { codes: null, fetchFailed: true };
  }

  const payload = obj.data ?? obj;
  if (payload && typeof payload === 'object') {
    const data = /** @type {Record<string, unknown>} */ (payload);
    if (Array.isArray(data.activeComponentCodes)) {
      return { codes: data.activeComponentCodes, fetchFailed: false };
    }
  }

  if (Array.isArray(obj.activeComponentCodes)) {
    return { codes: obj.activeComponentCodes, fetchFailed: false };
  }

  if (obj.success === true) {
    return { codes: [], fetchFailed: false };
  }

  return { codes: null, fetchFailed: true };
}

/**
 * @param {unknown} res
 * @returns {string[]}
 */
function parseActiveComponentCodes(res) {
  const { codes, fetchFailed } = parseActiveComponentCodesResponse(res);
  if (fetchFailed || codes == null) {
    return [];
  }
  return codes;
}

/**
 * @returns {Promise<{ codes: string[] | null, fetchFailed: boolean }>}
 */
async function fetchActiveComponentCodesWithRetry() {
  const request = () =>
    StandardizedApi.get(TENANT_COMPONENT_API.ACTIVE_CODES, {}, { unwrapApiEnvelope: false });

  let result = parseActiveComponentCodesResponse(await request());
  if (result.fetchFailed) {
    await new Promise((resolve) => {
      setTimeout(resolve, ACTIVE_CODES_RETRY_DELAY_MS);
    });
    result = parseActiveComponentCodesResponse(await request());
  }
  return result;
}

export const TenantComponentFlagsProvider = ({ children }) => {
  const { isLoggedIn, hasCheckedSession, user } = useSession();
  const sessionTenantId = user?.tenantId?.trim() || '';
  const fetchEnabled = isLoggedIn && hasCheckedSession;
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [activeCodes, setActiveCodes] = useState([]);

  useEffect(() => {
    if (!fetchEnabled) {
      setLoading(false);
      setLoaded(false);
      setFetchFailed(false);
      setActiveCodes([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    setFetchFailed(false);

    getTenantId().then((resolvedTenantId) => {
      if (cancelled || !resolvedTenantId) {
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[TenantComponentFlags] active-codes fetch tenant:',
          resolvedTenantId,
          'session.user.tenantId:',
          sessionTenantId || '(empty)'
        );
      }
    });

    fetchActiveComponentCodesWithRetry()
      .then(({ codes, fetchFailed: failed }) => {
        if (cancelled) {
          return;
        }
        if (failed || codes == null) {
          setFetchFailed(true);
          setActiveCodes([]);
        } else {
          setFetchFailed(false);
          setActiveCodes(codes);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchFailed(true);
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
  }, [fetchEnabled, sessionTenantId]);

  const flagsPending =
    isLoggedIn && (!hasCheckedSession || !fetchEnabled || !loaded || loading);
  const flagsIndeterminate = flagsPending || fetchFailed;

  const isActive = useMemo(
    () => (code) => {
      if (!code || flagsIndeterminate) {
        return false;
      }
      return activeCodes.includes(code);
    },
    [activeCodes, flagsIndeterminate]
  );

  const adminShopCatalogEnabled = useMemo(
    () => (flagsIndeterminate ? undefined : isActive(PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG)),
    [flagsIndeterminate, isActive]
  );

  const clientShopEnabled = useMemo(
    () => (flagsIndeterminate ? undefined : isActive(PLATFORM_COMPONENT_CODES.CLIENT_SHOP)),
    [flagsIndeterminate, isActive]
  );

  const clientRewardEnabled = useMemo(
    () => (flagsIndeterminate ? undefined : isActive(PLATFORM_COMPONENT_CODES.CLIENT_REWARD)),
    [flagsIndeterminate, isActive]
  );

  const value = useMemo(
    () => ({
      loading: flagsPending,
      fetchFailed,
      activeCodes,
      isActive,
      adminShopCatalogEnabled,
      clientShopEnabled,
      clientRewardEnabled
    }),
    [
      flagsPending,
      fetchFailed,
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
 *   fetchFailed: boolean,
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
      fetchFailed: false,
      activeCodes: [],
      isActive: () => false,
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    };
  }

  return context;
}

export { parseActiveComponentCodes };
