/**
 * 강제 업데이트 게이트 카피
 *
 * @author MindGarden
 * @since 2026-05-18
 */

export const FORCE_UPDATE_COPY = {
  modalTitle: '업데이트 필요',
  defaultMessage: '새 버전이 필요합니다. 업데이트 후 이용해 주세요.',
  updateButton: '업데이트',
  versionLine: (current: string, min: string) =>
    `현재 버전 ${current} · 필요 버전 ${min}`,
} as const;
