/**
 * 상담사 수입 화면 — 정책상 비노출. 딥링크 시 더보기로 보냄.
 * SSOT: docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md (상담사 LNB 재무 비노출)
 *
 * @author MindGarden
 * @since 2026-05-15
 */
import { Redirect } from 'expo-router';

export default function ConsultantIncomeBlockedScreen() {
  return <Redirect href="/(consultant)/(more)" />;
}
