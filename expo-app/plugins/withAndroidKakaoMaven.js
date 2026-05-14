/**
 * Expo config plugin — Android 루트 `build.gradle` 정리.
 * 1) Kakao Maven: @react-native-seoul/kakao-login 의 `com.kakao.sdk:*` 해석용.
 * 2) 고정 Kotlin 1.5.10 classpath 제거: RN/Expo 템플릿이 남기면 KSP·플러그인과 충돌.
 *
 * @see https://developers.kakao.com/docs/latest/en/android/getting-started#project-setting
 */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const KAKAO_MARKER = 'devrepo.kakao.com';

function withAndroidKakaoMaven(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      return mod;
    }
    let { contents } = mod.modResults;

    /* 고정 구형 Kotlin classpath 제거 (버전 없는 classpath만 사용, gradle.properties 연동) */
    contents = contents.replace(
      /\s*classpath\s+['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:1\.5\.10['"]\s*\n/g,
      '\n',
    );

    if (!contents.includes(KAKAO_MARKER)) {
      const replaced = contents.replace(
        /(maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\})/,
        "$1\n    maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }",
      );
      if (replaced === contents) {
        contents = contents.replace(
          /(mavenCentral\(\))/,
          "$1\n    maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }",
        );
      } else {
        contents = replaced;
      }
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

module.exports = withAndroidKakaoMaven;
