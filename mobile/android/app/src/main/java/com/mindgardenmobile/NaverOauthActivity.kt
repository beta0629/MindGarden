package com.mindgardenmobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

/**
 * 네이버 로그인 OAuth 콜백을 처리하는 Activity
 * naverMindGardenMobileApp://callback 스킴으로 전달되는 콜백을 처리합니다.
 */
class NaverOauthActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 네이버 로그인 SDK가 콜백을 자동으로 처리하므로
        // 여기서는 단순히 Activity를 종료합니다.
        finish()
    }
}

