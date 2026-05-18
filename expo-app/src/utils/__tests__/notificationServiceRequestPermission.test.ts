jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('@/theme/tokens', () => ({
  colors: { consultant: { primary: '#000000' } },
}));

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { requestOsNotificationPermission } from '@/utils/notificationPermissionFlow';

describe('requestOsNotificationPermission', () => {
  const getPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
  const requestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;
  const setNotificationChannelAsync = Notifications.setNotificationChannelAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    requestPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
    setNotificationChannelAsync.mockResolvedValue(undefined);
  });

  it('Android: creates notification channel before requesting permission', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    const callOrder: string[] = [];
    setNotificationChannelAsync.mockImplementation(async () => {
      callOrder.push('channel');
    });
    getPermissionsAsync.mockImplementation(async () => {
      callOrder.push('getPermissions');
      return { status: 'undetermined', canAskAgain: true };
    });
    requestPermissionsAsync.mockImplementation(async () => {
      callOrder.push('requestPermissions');
      return { status: 'granted', canAskAgain: true };
    });

    const granted = await requestOsNotificationPermission();

    expect(granted).toBe(true);
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ name: 'MindGarden 알림' }),
    );
    expect(callOrder.indexOf('channel')).toBeLessThan(callOrder.indexOf('getPermissions'));
    expect(callOrder.indexOf('channel')).toBeLessThan(callOrder.indexOf('requestPermissions'));
  });

  it('iOS: does not create Android channel', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    await requestOsNotificationPermission();

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
