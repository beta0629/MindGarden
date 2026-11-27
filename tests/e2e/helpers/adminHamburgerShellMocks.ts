/**
 * 관리자 햄버거 셸 E2E용 API 목 — 실데이터 쓰기·문자 발송 금지.
 */
import type { Page } from '@playwright/test';

/** API(menuName/menuPath) 형태 LNB 픽스처 — 사무원 필터 패리티 입력 SSOT */
export const E2E_ADMIN_LNB_RAW_TREE = [
  { menuName: '대시보드', menuPath: '/admin/dashboard', menuCode: 'ADM_DASHBOARD', children: [] as any[] },
  {
    menuName: '통합 스케줄',
    menuPath: '/admin/integrated-schedule',
    menuCode: 'ADM_INTEGRATED_SCHEDULE',
    children: [] as any[]
  },
  {
    menuName: '사용자 관리',
    menuPath: '/admin/user-management',
    menuCode: 'ADM_USER_MANAGEMENT',
    children: [] as any[]
  },
  {
    menuName: '배정·결제·환불',
    menuPath: '/admin/mapping-management',
    menuCode: 'ADM_MATCHING_PAYMENT_REFUND',
    children: [
      { menuName: '배정 관리(환불·취소)', menuPath: '/admin/mapping-management', children: [] },
      { menuName: '결제/구독 관리', menuPath: '/admin/billing/subscriptions', children: [] },
      { menuName: '결제 수단', menuPath: '/admin/billing/payment-methods', children: [] },
      {
        menuName: '미결제 배정 정리',
        menuPath: '/admin/mappings/pending-payment-cleanup',
        children: []
      }
    ]
  },
  {
    menuName: '운영·재무',
    menuPath: '/erp/dashboard',
    menuCode: 'ADM_ERP',
    children: [
      { menuName: '운영 현황', menuPath: '/erp/dashboard', children: [] },
      { menuName: '이번 달 돈', menuPath: '/erp/financial', children: [] },
      { menuName: '환불 관리', menuPath: '/erp/refund-management', children: [] },
      { menuName: '예산 관리', menuPath: '/erp/budget', children: [] },
      { menuName: '상담사 지급', menuPath: '/erp/salary', children: [] },
      { menuName: '승인 센터', menuPath: '/erp/approvals', children: [] }
    ]
  },
  {
    menuName: '시스템·설정',
    menuPath: '/tenant/profile',
    menuCode: 'ADM_SETTINGS',
    children: [
      { menuName: '센터 프로필', menuPath: '/tenant/profile', children: [] },
      { menuName: '브랜딩', menuPath: '/admin/branding', children: [] },
      {
        menuName: '시스템 설정',
        menuPath: '/admin/system-config',
        menuCode: 'ADM_SETTINGS_SYSTEM',
        children: []
      },
      {
        menuName: '결제 연결',
        menuPath: '/tenant/pg-configurations',
        menuCode: 'ADM_SETTINGS_PG',
        children: []
      },
      {
        menuName: 'AI 프로바이더 관리',
        menuPath: '/admin/system/ai-providers',
        menuCode: 'ADM_SETTINGS_AI_PROVIDER',
        children: []
      },
      {
        menuName: '컴플라이언스',
        menuPath: '/admin/compliance',
        menuCode: 'ADM_REPORTS_COMP',
        children: []
      },
      { menuName: '수동 알림 발송', menuPath: '/admin/manual-notification', children: [] },
      { menuName: 'SMS 템플릿 관리', menuPath: '/admin/sms-templates', children: [] }
    ]
  }
];

const CORS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
};

function jsonOk(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify({ success: true, data })
  };
}

export type ShellMockUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  permissionGroupCodes?: string[];
  tenantId?: string;
};

/**
 * 화면 로드에 필요한 API를 전부 목으로 채운다. 쓰기·문자 API도 빈 성공으로 흡수.
 */
export async function installAdminHamburgerShellMocks(
  page: Page,
  user: ShellMockUser
): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    if (url.includes('/auth/current-user') || url.includes('/auth/session-info')) {
      await route.fulfill(jsonOk(user));
      return;
    }

    if (url.includes('/menus/lnb')) {
      await route.fulfill(jsonOk(E2E_ADMIN_LNB_RAW_TREE));
      return;
    }

    if (url.includes('/admin/mappings') || url.includes('/schedules')) {
      if (url.includes('/stats')) {
        await route.fulfill(jsonOk({ total: 0, active: 0, pendingPayment: 0 }));
        return;
      }
      await route.fulfill(
        jsonOk({
          mappings: [],
          content: [],
          schedules: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
          last: true
        })
      );
      return;
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      // 실데이터 쓰기·문자 발송 차단 — 빈 성공만
      await route.fulfill(jsonOk({}));
      return;
    }

    await route.fulfill(jsonOk([]));
  });
}
