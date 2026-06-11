/**
 * 일반 로그인(전화 + 비밀번호) 다중 매치 응답 감지 — 단위 테스트.
 *
 * <p>P1 silent first 차단(2026-06-11) 흐름의 응답 본문 파싱 검증:</p>
 * <ul>
 *   <li>top-level / data 래퍼 둘 다에서 신호 감지</li>
 *   <li>토큰 또는 후보 누락 시 null 반환(부적합 응답 차단)</li>
 *   <li>단일 후보 응답은 신호 아님(다중 매치 정의에 부합하지 않음)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

import {
  detectPasswordLoginMultipleAccounts,
  MULTIPLE_ACCOUNTS_RESPONSE_TYPE,
} from '@/utils/passwordLoginMultiAccountSignal';

const candidateA = {
  userId: 11,
  role: 'CONSULTANT',
  roleDisplayLabel: '상담사',
  dashboardGuide: '로그인 시 상담사 대시보드로 이동합니다.',
  optionLabel: '상담사 계정 (ID: 11)',
  maskedEmail: 'a***@example.com',
  branchName: '인천 본점',
};

const candidateB = {
  userId: 22,
  role: 'ADMIN',
  roleDisplayLabel: '관리자',
  dashboardGuide: '로그인 시 관리자 대시보드로 이동합니다.',
  optionLabel: '관리자 계정 (ID: 22)',
  maskedEmail: 'b***@example.com',
};

describe('detectPasswordLoginMultipleAccounts — P1 silent first 차단', () => {
  test('top-level multipleAccounts=true + 토큰 + 후보 2명 → 신호 반환', () => {
    const result = detectPasswordLoginMultipleAccounts({
      multipleAccounts: true,
      responseType: MULTIPLE_ACCOUNTS_RESPONSE_TYPE,
      selectionToken: 'tok-a',
      candidates: [candidateA, candidateB],
      message: '연결할 계정을 선택해주세요.',
    });
    expect(result).not.toBeNull();
    expect(result?.selectionToken).toBe('tok-a');
    expect(result?.candidates).toHaveLength(2);
    expect(result?.candidates[0]?.userId).toBe(11);
    expect(result?.message).toBe('연결할 계정을 선택해주세요.');
  });

  test('ApiResponse 래퍼 (data.multipleAccounts) 도 동일하게 감지', () => {
    const result = detectPasswordLoginMultipleAccounts({
      success: false,
      message: '연결할 계정을 선택해주세요.',
      data: {
        multipleAccounts: true,
        responseType: MULTIPLE_ACCOUNTS_RESPONSE_TYPE,
        selectionToken: 'tok-b',
        candidates: [candidateA, candidateB],
      },
    });
    expect(result).not.toBeNull();
    expect(result?.selectionToken).toBe('tok-b');
    expect(result?.candidates).toHaveLength(2);
  });

  test('후보가 1명뿐이면 다중 매치 신호 아님(단일 매치 정상 흐름)', () => {
    const result = detectPasswordLoginMultipleAccounts({
      multipleAccounts: true,
      selectionToken: 'tok-x',
      candidates: [candidateA],
    });
    expect(result).toBeNull();
  });

  test('selectionToken 누락 시 null 반환(부적합 응답 차단)', () => {
    const result = detectPasswordLoginMultipleAccounts({
      multipleAccounts: true,
      candidates: [candidateA, candidateB],
    });
    expect(result).toBeNull();
  });

  test('flag 없으면 null', () => {
    expect(
      detectPasswordLoginMultipleAccounts({
        success: true,
        user: { id: 1 },
      }),
    ).toBeNull();
    expect(detectPasswordLoginMultipleAccounts(null)).toBeNull();
    expect(detectPasswordLoginMultipleAccounts(undefined)).toBeNull();
  });
});
