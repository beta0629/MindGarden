#!/bin/bash

# 깨진 import 문을 찾아서 완전히 제거하는 스크립트

cd /Users/mind/mindGarden

# 깨진 import 패턴을 찾아서 제거
find frontend/src/components -name "*.js" -type f | while read file; do
  # // import { 로 시작하는 줄부터 다음 import 문 전까지 제거
  perl -i -0pe 's/\/\/ import \{[^}]*$//gm' "$file"
  
  # 고아가 된 import 항목들 제거 (줄 시작이 공백 + 단어 + 쉼표)
  perl -i -pe 's/^\s+\w+,?\s*$//g' "$file"
  
  # 빈 줄 정리 (연속된 빈 줄을 하나로)
  perl -i -00 -pe 's/\n\n\n+/\n\n/g' "$file"
done

echo "✅ 깨진 import 문 제거 완료"



