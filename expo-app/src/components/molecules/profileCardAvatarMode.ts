/**
 * profileCardAvatarMode — ProfileCard 가 원격 아바타를 시도해야 하는지 판별 (pure helper).
 *
 * <p>P1 핫픽스 (2026-06-10) — 운영 user id=20 사례: 더보기 상단 ProfileCard 가
 * 자체 lucide `<User>` placeholder 만 렌더해 BE 저장 프로필 이미지가 누락됐다.
 * 본 helper 로 분기 조건을 단일화하고 jest 회귀 테스트로 보호한다.</p>
 *
 * react-native / expo-image 에 의존하지 않으므로 jest `testEnvironment=node` 에서
 * 직접 검증 가능하다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */

/**
 * 원격(또는 로컬 URI) 아바타로 fetch 시도해야 하는지 판별.
 *
 * @param uri DB·API 응답의 원본 값. 절대/상대 path/null/undefined/빈 문자열 가능.
 * @returns 비어있지 않은 문자열이면 true, 그렇지 않으면 placeholder fallback (false).
 */
export function shouldRenderProfileCardAvatar(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.trim().length > 0;
}
