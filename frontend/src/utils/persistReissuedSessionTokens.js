/**
 * 비밀번호 변경 성공 응답의 재발급 토큰을 현재 세션에만 반영한다.
 * 토큰 값과 응답 본문은 로그하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-19
 */

/**
 * accessToken 이 있고 현재 사용자가 있을 때만 sessionManager.setUser 를 호출한다.
 *
 * @param {{ accessToken?: string, refreshToken?: string } | null | undefined} result
 * @returns {Promise<void>}
 */
export async function persistReissuedSessionTokens(result) {
  if (!result || !result.accessToken) {
    return;
  }
  const sessionManager = (await import('./sessionManager')).default;
  const currentUser = sessionManager.getUser();
  if (!currentUser) {
    return;
  }
  sessionManager.setUser(currentUser, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });
}
