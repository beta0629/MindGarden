/**
 * 앱 기동 시 네이티브 버전 검사 (테넌트·인증 무관)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiGet } from '@/api/client';
import { MOBILE_APP_VERSION_CHECK } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';

export type MobileAppVersionCheckResult = {
  updateRequired: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  minVersion: string;
  minVersionCode?: number | null;
  storeUrl: string;
  message: string;
};

export type ForceUpdateCheckState = {
  loading: boolean;
  data: MobileAppVersionCheckResult | null;
  error: boolean;
};

function resolveNativeAppVersion(): string {
  return (
    Constants.nativeApplicationVersion?.trim() ||
    Constants.expoConfig?.version?.trim() ||
    '0.0.0'
  );
}

function resolveAndroidVersionCode(): number | undefined {
  if (Platform.OS !== 'android') {
    return undefined;
  }
  const fromConfig = Constants.expoConfig?.android?.versionCode;
  if (typeof fromConfig === 'number' && Number.isFinite(fromConfig)) {
    return fromConfig;
  }
  const build = Constants.nativeBuildVersion?.trim();
  if (build) {
    const parsed = parseInt(build, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function useForceUpdateCheck(enabled: boolean): ForceUpdateCheckState {
  const [state, setState] = useState<ForceUpdateCheckState>({
    loading: enabled,
    data: null,
    error: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, data: null, error: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));

    void (async () => {
      try {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const version = resolveNativeAppVersion();
        const versionCode = resolveAndroidVersionCode();
        const raw = await apiGet<unknown>(MOBILE_APP_VERSION_CHECK, {
          platform,
          version,
          ...(versionCode != null ? { versionCode } : {}),
        });
        const data = unwrapApiResponse<MobileAppVersionCheckResult>(raw);
        if (cancelled) {
          return;
        }
        if (data == null) {
          setState({ loading: false, data: null, error: true });
          return;
        }
        setState({ loading: false, data, error: false });
      } catch {
        if (!cancelled) {
          setState({ loading: false, data: null, error: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
