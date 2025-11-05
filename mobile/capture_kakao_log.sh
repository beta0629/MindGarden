#!/bin/bash

echo "카카오 로그인 버튼을 눌러주세요. 로그를 20초간 수집합니다..."
adb logcat -c
adb logcat | grep -E "Kakao|kakao|KAKAO|OAuth|oauth|Authorization|authorization|CustomTab|RNKakaoLogins|ReactNativeJS|Chrome|Intent" -i | head -500 | tee kakao_capture_log.txt
echo ""
echo "로그가 kakao_capture_log.txt 파일에 저장되었습니다."

