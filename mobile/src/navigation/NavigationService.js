/**
 * Navigation Service
 * React Navigation에서 사용할 수 있는 전역 네비게이션 서비스
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const NavigationService = {
  navigate: (name, params) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    } else {
      console.warn('Navigation is not ready yet');
    }
  },
  
  goBack: () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },
  
  reset: (state) => {
    if (navigationRef.isReady()) {
      navigationRef.reset(state);
    }
  },
  
  getCurrentRoute: () => {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  },
};

