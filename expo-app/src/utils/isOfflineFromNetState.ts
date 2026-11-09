/**
 * NetInfo 상태 → 오프라인 UI/onlineManager 판정.
 * `null`(unknown) 은 disconnected 로 취급하지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */

export type OfflineNetStateInput = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

/**
 * 오프라인으로 볼지 여부.
 * - `isConnected === false` → 오프라인 (명시적 단절)
 * - `isInternetReachable === false` → 오프라인 (캡티브 포털 등)
 * - `isConnected === null` / `isInternetReachable === null` → unknown, 오프라인 아님
 */
export function isOfflineFromNetState(state: OfflineNetStateInput): boolean {
  if (state.isConnected === false) {
    return true;
  }
  if (state.isInternetReachable === false) {
    return true;
  }
  return false;
}
