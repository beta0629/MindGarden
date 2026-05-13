/**
 * 상담사 프로필
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { MoreAccountProfile } from '@/components/organisms/MoreAccountProfile';

export default function ConsultantProfile() {
  return (
    <MoreAccountProfile
      roleLabel="상담사"
      settingsHref="/(consultant)/(more)/settings"
      notificationSettingsHref="/(consultant)/(more)/notification-settings"
    />
  );
}
