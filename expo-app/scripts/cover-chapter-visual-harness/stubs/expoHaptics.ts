/**
 * 하네스 전용 `expo-haptics` 대체 — `PrimaryEntryCta` 는 web 에서 호출하지 않지만 import 는 해석돼야 한다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export async function impactAsync(_style?: ImpactFeedbackStyle): Promise<void> {
  return undefined;
}
