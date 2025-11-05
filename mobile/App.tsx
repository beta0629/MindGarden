/**
 * MindGarden Mobile App
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/Notification'; // Notification.js에서 toastConfig를 import
import { SessionProvider } from './src/contexts/SessionContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeNaverSDK } from './src/utils/socialLogin';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  // 앱 시작 시 네이버 SDK 초기화
  useEffect(() => {
    initializeNaverSDK().catch(error => {
      console.error('네이버 SDK 초기화 실패:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SessionProvider>
        <NotificationProvider>
          <AppNavigator />
          {/* Toast 메시지를 전역으로 표시하기 위해 최상단 컴포넌트에 추가 */}
          <Toast config={toastConfig} /> 
        </NotificationProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
};

export default App;
