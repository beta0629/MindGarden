package com.mindgardenmobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.kakao.sdk.common.KakaoSdk // Kakao SDK import 추가
import android.content.pm.PackageManager // getKakaoNativeAppKey를 위해 추가
import android.util.Log // Log import 추가
import com.mindgardenmobile.BuildConfig // BuildConfig import 추가

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    // 카카오 SDK 디버그 모드 활성화
    // 개발 환경에서만 활성화하는 것이 좋습니다.
    // BuildConfig.DEBUG는 debug 빌드에서만 true입니다.
    if (BuildConfig.DEBUG) {
        Log.d("KakaoSdk", "Kakao SDK Debug Mode Enabled")
    }

    val kakaoNativeAppKey = getKakaoNativeAppKey()
    if (kakaoNativeAppKey != null) {
      Log.d("KakaoSdk", "Kakao Native App Key found: $kakaoNativeAppKey")
      try {
        KakaoSdk.init(this, kakaoNativeAppKey)
        Log.d("KakaoSdk", "Kakao SDK initialized successfully")
      } catch (e: Exception) {
        Log.e("KakaoSdk", "Kakao SDK initialization failed: ${e.message}", e)
      }
    } else {
      Log.e("KakaoSdk", "Kakao Native App Key not found in AndroidManifest.xml.")
    }
  }

  // AndroidManifest.xml에서 카카오 네이티브 앱 키를 가져오는 헬퍼 함수
  private fun getKakaoNativeAppKey(): String? {
    try {
      val applicationInfo = packageManager.getApplicationInfo(
          packageName, PackageManager.GET_META_DATA
      )
      return applicationInfo.metaData.getString("com.kakao.sdk.AppKey")
    } catch (e: PackageManager.NameNotFoundException) {
      e.printStackTrace()
      return null
    }
  }
}
