/**
 * TanStack Query 목록 — `!ready`·에러를 로딩 스켈레톤에 섞지 않을 때 사용
 *
 * @author MindGarden
 * @since 2026-05-18
 */
export type AdminListQueryLoadingOptions = {
  readonly isError?: boolean;
  readonly enabled?: boolean;
  readonly isFetched?: boolean;
  readonly fetchStatus?: 'fetching' | 'paused' | 'idle';
};

export function isAdminListQueryLoading(
  isLoading: boolean,
  data: readonly unknown[] | undefined,
  options?: AdminListQueryLoadingOptions,
): boolean {
  if (options?.isError === true) {
    return false;
  }
  if (
    options?.fetchStatus === 'idle' &&
    options?.isFetched === false &&
    options?.enabled === false
  ) {
    return false;
  }
  return isLoading && data === undefined;
}
