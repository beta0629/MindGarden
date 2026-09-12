/**
 * LNB 메뉴 트리에서 menuCode 접근 여부 헬퍼 (fail-closed)
 *
 * @author MindGarden
 * @since 2026-09-11
 */

export type LnbMenuNode = {
  menuCode?: string | null;
  children?: LnbMenuNode[] | null;
};

/**
 * 트리에 menuCode가 있으면 true.
 * menus가 null/undefined(미로드)면 false — fail-closed.
 */
export function hasMenuCodeInTree(
  menus: LnbMenuNode[] | null | undefined,
  menuCode: string
): boolean {
  if (!menuCode || menus == null) {
    return false;
  }
  if (!Array.isArray(menus) || menus.length === 0) {
    return false;
  }
  for (const node of menus) {
    if (!node) {
      continue;
    }
    if (node.menuCode === menuCode) {
      return true;
    }
    if (hasMenuCodeInTree(node.children ?? null, menuCode)) {
      return true;
    }
  }
  return false;
}

/**
 * 권한 로드 전·실패 시 커뮤니티 숨김(fail-closed).
 * 로드 완료 후에만 menuCode 존재 여부로 판단.
 */
export function isCommunityMenuVisible(options: {
  menus: LnbMenuNode[] | null | undefined;
  menuCode: string;
  ready: boolean;
}): boolean {
  if (!options.ready) {
    return false;
  }
  return hasMenuCodeInTree(options.menus, options.menuCode);
}
