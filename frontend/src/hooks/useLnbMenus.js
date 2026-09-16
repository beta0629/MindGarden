/**
 * LNB 메뉴 API 훅 — RoleMenuPermission 반영
 *
 * @author MindGarden
 * @since 2026-09-11
 */

import { useCallback, useEffect, useState } from 'react';
import { getLnbMenus } from '../utils/menuApi';
import { getLnbTreeFromResponse } from '../utils/lnbMenuUtils';
import {
  isCommunityMenuVisible,
  MENU_PERMISSION_CODES
} from '../utils/menuAccessUtils';

/**
 * @returns {{ menus: Array|null, ready: boolean, refetch: Function }}
 */
export function useLnbMenus() {
  const [menus, setMenus] = useState(null);
  const [ready, setReady] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const response = await getLnbMenus();
      const tree = getLnbTreeFromResponse(response);
      setMenus(Array.isArray(tree) ? tree : []);
    } catch {
      setMenus([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getLnbMenus();
        if (cancelled) {
          return;
        }
        const tree = getLnbTreeFromResponse(response);
        setMenus(Array.isArray(tree) ? tree : []);
      } catch {
        if (!cancelled) {
          setMenus([]);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { menus, ready, refetch };
}

/**
 * @param {string} menuCode
 * @returns {{ allowed: boolean, ready: boolean }}
 */
export function useCommunityMenuAllowed(menuCode) {
  const { menus, ready } = useLnbMenus();
  const allowed = isCommunityMenuVisible({ menus, menuCode, ready });
  return { allowed, ready };
}

export { MENU_PERMISSION_CODES };
