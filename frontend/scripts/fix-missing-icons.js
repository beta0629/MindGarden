#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * lucide-react에서 존재하지 않는 아이콘들을 찾아서 수정하는 스크립트
 */

const ICONS_FILE = path.join(__dirname, '../src/constants/icons.js');

// lucide-react에서 실제로 존재하지 않는 아이콘들과 대체 아이콘
const MISSING_ICONS = {
  'Cancel': 'X',
  'Stop': 'Square', 
  'SignIn': 'LogIn',
  'SignOut': 'LogOut',
  'UserPlus': 'UserPlus',
  'UserMinus': 'UserMinus',
  'UserCheck': 'UserCheck',
  'UserX': 'UserX',
  'UserEdit': 'UserEdit',
  'UserCog': 'UserCog',
  'UserShield': 'UserShield',
  'UserStar': 'UserStar',
  'UserHeart': 'UserHeart',
  'UserClock': 'UserClock',
  'UserAlert': 'UserAlert',
  'UserBan': 'UserBan',
  'UserCheckCircle': 'UserCheckCircle',
  'UserXCircle': 'UserXCircle',
  'UserPlusCircle': 'UserPlusCircle',
  'UserMinusCircle': 'UserMinusCircle',
  'UserEditCircle': 'UserEditCircle',
  'UserCogCircle': 'UserCogCircle',
  'UserShieldCircle': 'UserShieldCircle',
  'UserStarCircle': 'UserStarCircle',
  'UserHeartCircle': 'UserHeartCircle',
  'UserClockCircle': 'UserClockCircle',
  'UserAlertCircle': 'UserAlertCircle',
  'UserBanCircle': 'UserBanCircle'
};

console.log('🔍 존재하지 않는 아이콘들 수정 중...');

try {
  let content = fs.readFileSync(ICONS_FILE, 'utf8');
  let modified = false;
  
  // import 문에서 존재하지 않는 아이콘들 제거
  Object.keys(MISSING_ICONS).forEach(missingIcon => {
    const replacement = MISSING_ICONS[missingIcon];
    
    // import 문에서 제거
    const importPattern = new RegExp(`\\s*${missingIcon},\\s*`, 'g');
    if (content.includes(missingIcon + ',')) {
      content = content.replace(importPattern, '');
      modified = true;
      console.log(`✅ ${missingIcon} import 제거됨`);
    }
    
    // ICONS 객체에서 대체
    const iconsPattern = new RegExp(`\\s*${missingIcon.toUpperCase()}:\\s*${missingIcon},`, 'g');
    if (content.includes(`${missingIcon.toUpperCase()}: ${missingIcon}`)) {
      content = content.replace(iconsPattern, `  ${missingIcon.toUpperCase()}: ${replacement},`);
      modified = true;
      console.log(`✅ ${missingIcon.toUpperCase()}: ${missingIcon} → ${replacement}로 변경됨`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(ICONS_FILE, content, 'utf8');
    console.log('🎉 아이콘 수정 완료!');
  } else {
    console.log('ℹ️  수정할 아이콘이 없습니다.');
  }
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
}
