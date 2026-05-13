/**
 * 내담자 프로필
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { MoreAccountProfile } from '@/components/organisms/MoreAccountProfile';

export default function ClientProfile() {
  return (
    <MoreAccountProfile
      roleLabel="내담자"
      settingsHref="/(client)/(more)/settings"
      notificationSettingsHref="/(client)/(more)/notification-settings"
    />
  );
}
