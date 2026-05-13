/**
 * 상담사 앱 설정
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { MoreAccountSettings } from '@/components/organisms/MoreAccountSettings';

export default function ConsultantSettings() {
  return (
    <MoreAccountSettings
      notificationSettingsHref="/(consultant)/(more)/notification-settings"
      profileHref="/(consultant)/(more)/profile"
    />
  );
}
