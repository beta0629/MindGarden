/**
 * Ops 셸 내비 트리 · 문구.
 * 라벨은 copy.json `nav.*` · `gnb.*` · `env.*` · `billing.invoices.badge`.
 * 현황만 1단 단독이고, 나머지 다섯은 그룹이다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

export const OPS_NAV_COPY = {
  ARIA_LABEL: "Ops 왼쪽 메뉴",
  OVERVIEW: "현황",
  ONBOARDING: "온보딩",
  ONBOARDING_LIST: "신청 목록",
  ONBOARDING_PENDING: "승인 대기",
  ONBOARDING_DONE: "처리 완료",
  TENANTS: "테넌트",
  TENANT_LIST: "테넌트 목록",
  TENANT_ADMINS: "관리자 계정",
  TENANT_DOMAINS: "도메인",
  TENANT_FEATURES: "기능 켜기",
  BILLING: "결제·청구",
  BILLING_PLANS: "요금제",
  PG_APPROVAL: "PG 승인",
  SUBSCRIPTIONS: "구독 목록",
  WEBHOOK_SECRET: "웹훅 비밀값",
  INVOICES: "청구 내역",
  PLATFORM: "플랫폼 설정",
  COMMON_CODES: "공통코드",
  SYSTEM_KEYS: "시스템 키",
  AI_KEYS: "AI 키",
  SMS: "문자 발송 설정",
  NOTIFICATION_TEST: "알림 테스트",
  MONITORING: "모니터링",
  CACHE: "캐시",
  SECURITY: "보안",
  API_PERFORMANCE: "API 성능"
} as const;

export const OPS_GNB_COPY = {
  LOGOUT: "로그아웃",
  LOGOUT_PENDING: "로그아웃 중...",
  MENU: "메뉴",
  MENU_OPEN: "메뉴 열기",
  MENU_CLOSE: "메뉴 닫기"
} as const;

export const OPS_ENV_COPY = {
  DEV: "개발",
  PROD: "운영"
} as const;

export const OPS_ENV_VALUE = {
  DEV: "dev",
  PROD: "prod"
} as const;

export const OPS_PLACEHOLDER_COPY = {
  BADGE: "준비 중",
  DESCRIPTION: "이 화면은 준비 중입니다.",
  TITLE_ID: "ops-placeholder-title"
} as const;

/** 로그아웃 후 로그인 화면으로 넘기기 전 짧은 대기. 세션 삭제가 반영될 시간을 둔다. */
export const OPS_LOGOUT_REDIRECT_DELAY_MS = 100;

export const OPS_NAV_ID = {
  OVERVIEW: "overview",
  ONBOARDING: "onboarding",
  ONBOARDING_LIST: "onboarding-list",
  ONBOARDING_PENDING: "onboarding-pending",
  ONBOARDING_DONE: "onboarding-done",
  TENANTS: "tenants",
  TENANT_LIST: "tenant-list",
  TENANT_ADMINS: "tenant-admins",
  TENANT_DOMAINS: "tenant-domains",
  TENANT_FEATURES: "tenant-features",
  BILLING: "billing",
  BILLING_PLANS: "billing-plans",
  PG_APPROVAL: "pg-approval",
  SUBSCRIPTIONS: "subscriptions",
  WEBHOOK_SECRET: "webhook-secret",
  INVOICES: "invoices",
  PLATFORM: "platform",
  COMMON_CODES: "common-codes",
  SYSTEM_KEYS: "system-keys",
  AI_KEYS: "ai-keys",
  SMS: "sms",
  NOTIFICATION_TEST: "notification-test",
  MONITORING: "monitoring",
  CACHE: "cache",
  SECURITY: "security",
  API_PERFORMANCE: "api-performance"
} as const;

export type OpsNavId = (typeof OPS_NAV_ID)[keyof typeof OPS_NAV_ID];

export const OPS_NAV_PATH = {
  OVERVIEW: "/dashboard",
  ONBOARDING_LIST: "/onboarding",
  ONBOARDING_PENDING: "/onboarding/pending",
  ONBOARDING_DONE: "/onboarding/done",
  ONBOARDING_DETAIL: "/onboarding/detail",
  TENANT_LIST: "/tenants",
  TENANT_ADMINS: "/tenants/admins",
  TENANT_DOMAINS: "/tenants/domains",
  TENANT_FEATURES: "/tenants/features",
  BILLING_PLANS: "/pricing",
  PG_APPROVAL: "/pg-approval",
  SUBSCRIPTIONS: "/billing/subscriptions",
  WEBHOOK_SECRET: "/billing/webhook-secret",
  INVOICES: "/billing/invoices",
  COMMON_CODES: "/platform/common-codes",
  SYSTEM_KEYS: "/platform/system-keys",
  AI_KEYS: "/platform/ai-keys",
  SMS: "/platform/sms",
  NOTIFICATION_TEST: "/platform/notification-test",
  CACHE: "/monitoring/cache",
  SECURITY: "/monitoring/security",
  API_PERFORMANCE: "/monitoring/api"
} as const;

export type OpsNavLeaf = {
  id: OpsNavId;
  label: string;
  href: string;
  placeholder: boolean;
};

export type OpsNavGroup = {
  id: OpsNavId;
  label: string;
  children: readonly OpsNavLeaf[];
};

export type OpsNavEntry =
  | { kind: "link"; item: OpsNavLeaf }
  | { kind: "group"; group: OpsNavGroup };

export const OPS_NAV_TREE: readonly OpsNavEntry[] = [
  {
    kind: "link",
    item: {
      id: OPS_NAV_ID.OVERVIEW,
      label: OPS_NAV_COPY.OVERVIEW,
      href: OPS_NAV_PATH.OVERVIEW,
      placeholder: false
    }
  },
  {
    kind: "group",
    group: {
      id: OPS_NAV_ID.ONBOARDING,
      label: OPS_NAV_COPY.ONBOARDING,
      children: [
        {
          id: OPS_NAV_ID.ONBOARDING_LIST,
          label: OPS_NAV_COPY.ONBOARDING_LIST,
          href: OPS_NAV_PATH.ONBOARDING_LIST,
          placeholder: false
        },
        {
          id: OPS_NAV_ID.ONBOARDING_PENDING,
          label: OPS_NAV_COPY.ONBOARDING_PENDING,
          href: OPS_NAV_PATH.ONBOARDING_PENDING,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.ONBOARDING_DONE,
          label: OPS_NAV_COPY.ONBOARDING_DONE,
          href: OPS_NAV_PATH.ONBOARDING_DONE,
          placeholder: true
        }
      ]
    }
  },
  {
    kind: "group",
    group: {
      id: OPS_NAV_ID.TENANTS,
      label: OPS_NAV_COPY.TENANTS,
      children: [
        {
          id: OPS_NAV_ID.TENANT_LIST,
          label: OPS_NAV_COPY.TENANT_LIST,
          href: OPS_NAV_PATH.TENANT_LIST,
          placeholder: false
        },
        {
          id: OPS_NAV_ID.TENANT_ADMINS,
          label: OPS_NAV_COPY.TENANT_ADMINS,
          href: OPS_NAV_PATH.TENANT_ADMINS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.TENANT_DOMAINS,
          label: OPS_NAV_COPY.TENANT_DOMAINS,
          href: OPS_NAV_PATH.TENANT_DOMAINS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.TENANT_FEATURES,
          label: OPS_NAV_COPY.TENANT_FEATURES,
          href: OPS_NAV_PATH.TENANT_FEATURES,
          placeholder: true
        }
      ]
    }
  },
  {
    kind: "group",
    group: {
      id: OPS_NAV_ID.BILLING,
      label: OPS_NAV_COPY.BILLING,
      children: [
        {
          id: OPS_NAV_ID.BILLING_PLANS,
          label: OPS_NAV_COPY.BILLING_PLANS,
          href: OPS_NAV_PATH.BILLING_PLANS,
          placeholder: false
        },
        {
          id: OPS_NAV_ID.PG_APPROVAL,
          label: OPS_NAV_COPY.PG_APPROVAL,
          href: OPS_NAV_PATH.PG_APPROVAL,
          placeholder: false
        },
        {
          id: OPS_NAV_ID.SUBSCRIPTIONS,
          label: OPS_NAV_COPY.SUBSCRIPTIONS,
          href: OPS_NAV_PATH.SUBSCRIPTIONS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.WEBHOOK_SECRET,
          label: OPS_NAV_COPY.WEBHOOK_SECRET,
          href: OPS_NAV_PATH.WEBHOOK_SECRET,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.INVOICES,
          label: OPS_NAV_COPY.INVOICES,
          href: OPS_NAV_PATH.INVOICES,
          placeholder: true
        }
      ]
    }
  },
  {
    kind: "group",
    group: {
      id: OPS_NAV_ID.PLATFORM,
      label: OPS_NAV_COPY.PLATFORM,
      children: [
        {
          id: OPS_NAV_ID.COMMON_CODES,
          label: OPS_NAV_COPY.COMMON_CODES,
          href: OPS_NAV_PATH.COMMON_CODES,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.SYSTEM_KEYS,
          label: OPS_NAV_COPY.SYSTEM_KEYS,
          href: OPS_NAV_PATH.SYSTEM_KEYS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.AI_KEYS,
          label: OPS_NAV_COPY.AI_KEYS,
          href: OPS_NAV_PATH.AI_KEYS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.SMS,
          label: OPS_NAV_COPY.SMS,
          href: OPS_NAV_PATH.SMS,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.NOTIFICATION_TEST,
          label: OPS_NAV_COPY.NOTIFICATION_TEST,
          href: OPS_NAV_PATH.NOTIFICATION_TEST,
          placeholder: true
        }
      ]
    }
  },
  {
    kind: "group",
    group: {
      id: OPS_NAV_ID.MONITORING,
      label: OPS_NAV_COPY.MONITORING,
      children: [
        {
          id: OPS_NAV_ID.CACHE,
          label: OPS_NAV_COPY.CACHE,
          href: OPS_NAV_PATH.CACHE,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.SECURITY,
          label: OPS_NAV_COPY.SECURITY,
          href: OPS_NAV_PATH.SECURITY,
          placeholder: true
        },
        {
          id: OPS_NAV_ID.API_PERFORMANCE,
          label: OPS_NAV_COPY.API_PERFORMANCE,
          href: OPS_NAV_PATH.API_PERFORMANCE,
          placeholder: true
        }
      ]
    }
  }
];

export type OpsNavSelection = {
  selectedId: OpsNavId | null;
  expandedGroupId: OpsNavId | null;
};

const EMPTY_SELECTION: OpsNavSelection = {
  selectedId: null,
  expandedGroupId: null
};

export function normalizeOpsPath(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? pathname;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

export function listOpsNavLeaves(): OpsNavLeaf[] {
  const leaves: OpsNavLeaf[] = [];
  for (const entry of OPS_NAV_TREE) {
    if (entry.kind === "link") {
      leaves.push(entry.item);
    } else {
      leaves.push(...entry.group.children);
    }
  }
  return leaves;
}

export function listOpsNavLabels(): string[] {
  const labels: string[] = [];
  for (const entry of OPS_NAV_TREE) {
    if (entry.kind === "link") {
      labels.push(entry.item.label);
    } else {
      labels.push(entry.group.label);
      for (const child of entry.group.children) {
        labels.push(child.label);
      }
    }
  }
  return labels;
}

export function findOpsNavLeaf(id: OpsNavId | null): OpsNavLeaf | null {
  if (!id) {
    return null;
  }
  return listOpsNavLeaves().find((leaf) => leaf.id === id) ?? null;
}

function groupIdForLeaf(id: OpsNavId): OpsNavId | null {
  for (const entry of OPS_NAV_TREE) {
    if (entry.kind === "link") {
      if (entry.item.id === id) {
        return null;
      }
      continue;
    }
    if (entry.group.children.some((child) => child.id === id)) {
      return entry.group.id;
    }
  }
  return null;
}

function selectionFor(id: OpsNavId): OpsNavSelection {
  return {
    selectedId: id,
    expandedGroupId: groupIdForLeaf(id)
  };
}

function matchesHref(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}

/**
 * 레일 선택.
 * 테넌트 상세(목록·교차 목록이 아닌 `/tenants/...`)는 테넌트 목록에 고정한다.
 * 온보딩 상세는 승인 대기에 고정한다.
 */
export function resolveOpsNavSelection(pathname: string | null): OpsNavSelection {
  if (!pathname) {
    return EMPTY_SELECTION;
  }
  const path = normalizeOpsPath(pathname);
  if (
    path === OPS_NAV_PATH.ONBOARDING_DETAIL ||
    path.startsWith(`${OPS_NAV_PATH.ONBOARDING_DETAIL}/`)
  ) {
    return selectionFor(OPS_NAV_ID.ONBOARDING_PENDING);
  }
  if (path === "/") {
    return selectionFor(OPS_NAV_ID.TENANT_LIST);
  }

  let best: OpsNavLeaf | null = null;
  for (const leaf of listOpsNavLeaves()) {
    if (!matchesHref(path, leaf.href)) {
      continue;
    }
    if (!best || leaf.href.length > best.href.length) {
      best = leaf;
    }
  }
  if (!best) {
    return EMPTY_SELECTION;
  }
  return selectionFor(best.id);
}

/**
 * 환경 알약 문구. `NEXT_PUBLIC_OPS_APP_ENV` 가 `prod` 일 때만 운영.
 * 그 외(개발 빌드·미설정)는 개발.
 */
export function resolveOpsEnvLabel(value: string | undefined): string {
  if (value === OPS_ENV_VALUE.PROD) {
    return OPS_ENV_COPY.PROD;
  }
  return OPS_ENV_COPY.DEV;
}
