const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      // react-native-reanimated의 경우 main 필드 (lib/module/index)를 사용
      if (realModuleName === 'react-native-reanimated') {
        const reanimatedPath = path.resolve(
          __dirname,
          'node_modules/react-native-reanimated/lib/module/index.js'
        );
        return {
          filePath: reanimatedPath,
          type: 'sourceFile',
        };
      }
      // 기본 resolver 사용
      return context.resolveRequest(context, realModuleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
