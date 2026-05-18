/**
 * TanStack Query 목록 — `!ready`를 로딩에 섞지 않을 때 사용
 *
 * @author MindGarden
 * @since 2026-05-18
 */
export function isAdminListQueryLoading(
  isLoading: boolean,
  data: readonly unknown[] | undefined,
): boolean {
  return isLoading && data === undefined;
}
