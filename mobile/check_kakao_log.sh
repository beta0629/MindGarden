#!/bin/bash

echo "카카오 로그인 버튼을 눌러주세요. 그 후 Enter를 누르면 로그를 확인합니다."
read -r
echo ""
echo "로그를 확인합니다..."
adb logcat -d | grep -iE "kakao|oauth|authorization|customtab|reactnativejs|chrome|intent.*kakao" | tail -100

