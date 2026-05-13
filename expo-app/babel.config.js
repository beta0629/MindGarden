/**
 * `@/` 경로는 **babel-plugin-module-resolver로 바꾸지 않는다.**
 * (바꾸면 Metro가 `../../../../src/...`만 보게 되어 `metro.config.js`의 `@/` 해석이 동작하지 않음)
 *
 * `@/` → `src/` 해석은 `metro.config.js`의 `resolveRequest` 전담.
 */
module.exports = function mindGardenBabelConfig(api) {
  // Metro·alias 수정 후에도 오래된 Babel 캐시가 남으면 `@/`가 `../../../../src/lib/...` 상대로만 남을 수 있음 — 키 변경으로 무효화
  api.cache(function babelCacheKey() {
    return 'mindgarden-expo-babel-v11-mmkv-relative';
  });
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
