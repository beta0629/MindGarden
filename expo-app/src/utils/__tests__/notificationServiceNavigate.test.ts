jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openSettings: jest.fn() },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Test',
  modelName: 'Test',
  osName: 'android',
  osVersion: '14',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('@/utils/notificationPermissionFlow', () => ({
  requestOsNotificationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/api/client', () => ({
  apiPost: jest.fn(),
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock('@/stores/useNotificationSettingsStore', () => ({
  useNotificationSettingsStore: {
    getState: jest.fn(() => ({ isEnabled: () => true })),
  },
}));

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  showInAppToast: jest.fn(),
}));

import { router } from 'expo-router';
import { PUSH_SCENARIOS } from '@/constants/pushScenarios';
import { NotificationService } from '@/services/NotificationService';
import { useAuthStore } from '@/stores/useAuthStore';

describe('NotificationService.navigateToScreen', () => {
  const routerPush = router.push as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes via resolvePushNavigationRoute for known client type', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ role: 'client' });

    NotificationService.navigateToScreen(PUSH_SCENARIOS.BOOKING_REMINDER.type, {
      scheduleId: 'sch-nav-1',
    });

    expect(routerPush).toHaveBeenCalledWith('/(client)/(sessions)/sch-nav-1');
  });

  it('routes consultant session to schedule detail', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ role: 'consultant' });

    NotificationService.navigateToScreen(PUSH_SCENARIOS.BOOKING_REMINDER.type, {
      id: 'sch-nav-2',
    });

    expect(routerPush).toHaveBeenCalledWith('/(consultant)/(schedule)/sch-nav-2');
  });

  it('falls back to notifications when type is unknown', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ role: 'client' });

    NotificationService.navigateToScreen('unknown_push_type', {});

    expect(routerPush).toHaveBeenCalledWith('/(client)/(more)/notifications');
  });

  it('no-ops when role is missing', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ role: null });

    NotificationService.navigateToScreen(PUSH_SCENARIOS.BOOKING_REMINDER.type, {
      scheduleId: 'x',
    });

    expect(routerPush).not.toHaveBeenCalled();
  });
});
