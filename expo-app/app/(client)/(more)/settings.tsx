/**
 * 내담자 앱 설정
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { MoreAccountSettings } from '@/components/organisms/MoreAccountSettings';

export default function ClientSettings() {
  return (
    <MoreAccountSettings
      notificationSettingsHref="/(client)/(more)/notification-settings"
      profileHref="/(client)/(more)/profile"
    />
  );
}
