// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * 어드민 **사전등록** 내담자·상담사 × **Kakao / Naver** 무간편가입 검증용 Playwright **골격**.
 * 실제 OAuth UI·리다이렉트는 CI에서 불안정하므로, 환경 변수 미설정 시 전부 `test.skip` 한다.
 *
 * 실행 예 (저장소 루트):
 *   cd tests/e2e && npx playwright test tests/auth/oauth-preregistered-kakao-naver.spec.ts --project=chromium
 *
 * 환경 변수 (프로바이더 로그인용 테스트 계정 — MindGarden DB 비밀번호 아님, 커밋 금지):
 *   SSOT 표: `tests/e2e/helpers/erpAuth.ts` 내 OAuth JSDoc 블록.
 *   - Kakao: `E2E_OAUTH_KAKAO_EMAIL`, `E2E_OAUTH_KAKAO_PASSWORD`
 *   - Naver: `E2E_OAUTH_NAVER_EMAIL`, `E2E_OAUTH_NAVER_PASSWORD`
 *
 * ---
 * [수동 체크리스트] 변수를 설정한 뒤 로컬에서 브라우저로 동일 시나리오를 검증할 때 참고.
 * 1. 어드민에서 해당 소셜 이메일(또는 식별자)로 내담자 또는 상담사를 **사전등록**한다.
 * 2. `/login` 에서 Kakao 또는 Naver 버튼으로 로그인을 시작한다.
 * 3. 프로바이더 동의·2단계 등 완료 후 MindGarden 콜백으로 돌아와 세션이 생기는지 확인한다.
 * 4. 역할별 기대 랜딩(내담자 대시보드 / 상담사 대시보드 등)을 확인한다.
 * 5. 시크릿은 `.env`·CI 변수 저장소에만 두고 저장소에 넣지 않는다.
 */

function envTrim(key: string): string | undefined {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') return undefined;
  return String(v).trim();
}

function requireKakaoOAuthEnv(): void {
  if (!envTrim('E2E_OAUTH_KAKAO_EMAIL') || !envTrim('E2E_OAUTH_KAKAO_PASSWORD')) {
    test.skip(
      true,
      'E2E_OAUTH_KAKAO_EMAIL·E2E_OAUTH_KAKAO_PASSWORD 미설정 — 카카오 OAuth 골격 생략(CI 안정). erpAuth.ts OAuth JSDoc 참고'
    );
  }
}

function requireNaverOAuthEnv(): void {
  if (!envTrim('E2E_OAUTH_NAVER_EMAIL') || !envTrim('E2E_OAUTH_NAVER_PASSWORD')) {
    test.skip(
      true,
      'E2E_OAUTH_NAVER_EMAIL·E2E_OAUTH_NAVER_PASSWORD 미설정 — 네이버 OAuth 골격 생략(CI 안정). erpAuth.ts OAuth JSDoc 참고'
    );
  }
}

test.describe('어드민 사전등록 내담자·상담사 × Kakao/Naver 무간편가입 (OAuth 골격)', () => {
  test.describe('Kakao · 카카오 — Naver 블록과 동일한 역할(내담자/상담사) 대칭 구조', () => {
    test('사전등록 내담자 — 카카오 무간편가입 (UI 골격)', async ({ page }: { page: Page }) => {
      requireKakaoOAuthEnv();

      await page.goto('/login');
      const kakaoButton = page.getByRole('button', { name: '카카오 로그인' });
      await expect(kakaoButton).toBeVisible({ timeout: 15000 });

      test.skip(
        true,
        '실제 카카오 OAuth 전체 플로우는 로컬·수동 전용 — 로그인 화면 버튼 가시성 확인 후 스킵'
      );
    });

    test('사전등록 상담사 — 카카오 무간편가입 (UI 골격)', async ({ page }: { page: Page }) => {
      requireKakaoOAuthEnv();

      await page.goto('/login');
      const kakaoButton = page.getByRole('button', { name: '카카오 로그인' });
      await expect(kakaoButton).toBeVisible({ timeout: 15000 });

      test.skip(
        true,
        '실제 카카오 OAuth 전체 플로우는 로컬·수동 전용 — 로그인 화면 버튼 가시성 확인 후 스킵'
      );
    });
  });

  test.describe('Naver · 네이버 — Kakao 블록과 동일한 역할(내담자/상담사) 대칭 구조', () => {
    test('사전등록 내담자 — 네이버 무간편가입 (UI 골격)', async ({ page }: { page: Page }) => {
      requireNaverOAuthEnv();

      await page.goto('/login');
      const naverButton = page.getByRole('button', { name: '네이버 로그인' });
      await expect(naverButton).toBeVisible({ timeout: 15000 });

      test.skip(
        true,
        '실제 네이버 OAuth 전체 플로우는 로컬·수동 전용 — 로그인 화면 버튼 가시성 확인 후 스킵'
      );
    });

    test('사전등록 상담사 — 네이버 무간편가입 (UI 골격)', async ({ page }: { page: Page }) => {
      requireNaverOAuthEnv();

      await page.goto('/login');
      const naverButton = page.getByRole('button', { name: '네이버 로그인' });
      await expect(naverButton).toBeVisible({ timeout: 15000 });

      test.skip(
        true,
        '실제 네이버 OAuth 전체 플로우는 로컬·수동 전용 — 로그인 화면 버튼 가시성 확인 후 스킵'
      );
    });
  });
});
