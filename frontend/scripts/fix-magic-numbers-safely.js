#!/usr/bin/env node

/**
 * Magic Numbers 교체 스크립트 개선 - 정규식 등 특수 케이스 처리
 */

const fs = require('fs');
const path = require('path');

// 상수 매핑 테이블 (더 안전한 매핑)
const SAFE_MAGIC_NUMBER_MAPPINGS = {
  // 시간 관련 (밀리초) - 안전한 매핑만
  '1000': 'TIME_CONSTANTS.SECOND',
  '3000': 'TIME_CONSTANTS.NOTIFICATION_DURATION',
  '5000': 'TIME_CONSTANTS.ERROR_NOTIFICATION_DURATION',
  '30000': 'TIME_CONSTANTS.POLLING_INTERVAL',
  '60000': 'TIME_CONSTANTS.LONG_POLLING_INTERVAL',
  
  // HTTP 상태 코드
  '200': 'HTTP_STATUS.OK',
  '201': 'HTTP_STATUS.CREATED',
  '400': 'HTTP_STATUS.BAD_REQUEST',
  '401': 'HTTP_STATUS.UNAUTHORIZED',
  '403': 'HTTP_STATUS.FORBIDDEN',
  '404': 'HTTP_STATUS.NOT_FOUND',
  '500': 'HTTP_STATUS.INTERNAL_SERVER_ERROR',
  
  // UI 관련
  '44': 'UI_CONSTANTS.MIN_TOUCH_TARGET_SIZE',
  '768': 'UI_CONSTANTS.MAX_MOBILE_WIDTH',
  '1024': 'UI_CONSTANTS.MAX_TABLET_WIDTH',
  '1200': 'UI_CONSTANTS.MAX_DESKTOP_WIDTH',
  '100': 'UI_CONSTANTS.SCROLL_THRESHOLD',
  '200': 'UI_CONSTANTS.INFINITE_SCROLL_THRESHOLD',
  '1000': 'UI_CONSTANTS.MODAL_Z_INDEX',
  '300': 'UI_CONSTANTS.BOUNCE_DURATION',
  
  // 비즈니스 로직
  '1': 'BUSINESS_CONSTANTS.USER_GRADE_BRONZE',
  '2': 'BUSINESS_CONSTANTS.USER_GRADE_SILVER',
  '3': 'BUSINESS_CONSTANTS.USER_GRADE_GOLD',
  '4': 'BUSINESS_CONSTANTS.USER_GRADE_PLATINUM',
  '5': 'BUSINESS_CONSTANTS.USER_GRADE_DIAMOND',
  '15': 'BUSINESS_CONSTANTS.MIN_CONSULTATION_DURATION',
  '30': 'BUSINESS_CONSTANTS.DEFAULT_CONSULTATION_DURATION',
  '60': 'BUSINESS_CONSTANTS.MAX_CONSULTATION_DURATION',
  '1000': 'BUSINESS_CONSTANTS.MIN_PAYMENT_AMOUNT',
  '1000000': 'BUSINESS_CONSTANTS.MAX_PAYMENT_AMOUNT',
  '2': 'BUSINESS_CONSTANTS.MIN_SEARCH_LENGTH',
  '50': 'BUSINESS_CONSTANTS.MAX_SEARCH_RESULTS',
  '10': 'BUSINESS_CONSTANTS.DEFAULT_PAGE_SIZE',
  '20': 'BUSINESS_CONSTANTS.DEFAULT_PAGE_SIZE',
  '100': 'BUSINESS_CONSTANTS.MAX_PAGE_SIZE',
  
  // 수학 관련
  '100': 'MATH_CONSTANTS.PERCENTAGE_MULTIPLIER',
  '2': 'MATH_CONSTANTS.DECIMAL_PLACES',
  '0.95': 'MATH_CONSTANTS.CONFIDENCE_LEVEL_95',
  '0.99': 'MATH_CONSTANTS.CONFIDENCE_LEVEL_99',
  '1': 'MATH_CONSTANTS.MIN_RATING',
  '5': 'MATH_CONSTANTS.MAX_RATING',
  '0': 'MATH_CONSTANTS.DEFAULT_RATING',
  
  // 데이터베이스 관련
  '20': 'DATABASE_CONSTANTS.DEFAULT_LIMIT',
  '1000': 'DATABASE_CONSTANTS.MAX_LIMIT',
  '100': 'DATABASE_CONSTANTS.MAX_BATCH_SIZE',
  
  // 보안 관련
  '8': 'SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH',
  '128': 'SECURITY_CONSTANTS.MAX_PASSWORD_LENGTH',
  '5': 'SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS',
  
  // API 관련
  '30': 'API_CONSTANTS.REQUEST_TIMEOUT_SECONDS',
  '3': 'API_CONSTANTS.MAX_RETRY_ATTEMPTS',
  '1000': 'API_CONSTANTS.RETRY_DELAY',
  '2': 'API_CONSTANTS.EXPONENTIAL_BACKOFF_MULTIPLIER',
  '100': 'API_CONSTANTS.BATCH_SIZE',
  
  // 폼 관련
  '1': 'FORM_CONSTANTS.MIN_INPUT_LENGTH',
  '255': 'FORM_CONSTANTS.MAX_INPUT_LENGTH',
  '2000': 'FORM_CONSTANTS.MAX_TEXTAREA_LENGTH',
  '500': 'FORM_CONSTANTS.MAX_COMMENT_LENGTH',
  '10': 'FORM_CONSTANTS.MAX_FILES_PER_UPLOAD',
  
  // 차트 관련
  '300': 'CHART_CONSTANTS.DEFAULT_CHART_HEIGHT',
  '200': 'CHART_CONSTANTS.MIN_CHART_HEIGHT',
  '600': 'CHART_CONSTANTS.MAX_CHART_HEIGHT',
  '1000': 'CHART_CONSTANTS.ANIMATION_DURATION',
  '100': 'CHART_CONSTANTS.ANIMATION_DELAY',
  '50': 'CHART_CONSTANTS.DEFAULT_DATA_POINTS',
  
  // 알림 관련
  '1': 'NOTIFICATION_CONSTANTS.PRIORITY_LOW',
  '2': 'NOTIFICATION_CONSTANTS.PRIORITY_MEDIUM',
  '3': 'NOTIFICATION_CONSTANTS.PRIORITY_HIGH',
  '4': 'NOTIFICATION_CONSTANTS.PRIORITY_URGENT',
  '5000': 'NOTIFICATION_CONSTANTS.AUTO_DISMISS_DELAY',
  '0': 'NOTIFICATION_CONSTANTS.STICKY_NOTIFICATION_DELAY',
  '5': 'NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS',
  '100': 'NOTIFICATION_CONSTANTS.MAX_STORED_NOTIFICATIONS',
};

// 안전하지 않은 패턴들 (교체하지 않을 패턴)
const UNSAFE_PATTERNS = [
  /\/\*[\s\S]*?\*\//g, // 주석
  /\/\/.*$/gm, // 한 줄 주석
  /\/[^\/\*].*\/[gimuy]*/g, // 정규식
  /['"`][^'"`]*['"`]/g, // 문자열
  /console\.log\([^)]*\)/g, // console.log
  /alert\([^)]*\)/g, // alert
  /confirm\([^)]*\)/g, // confirm
];

// Magic Numbers를 안전하게 상수로 교체하는 함수
function replaceMagicNumbersSafely(content) {
  let updatedContent = content;
  
  // 상수 import 추가 (이미 있으면 스킵)
  if (!updatedContent.includes("import { CONSTANTS } from '../constants/magicNumbers';") && 
      !updatedContent.includes("import CONSTANTS from '../constants/magicNumbers';")) {
    
    // React import 다음에 상수 import 추가
    const lines = updatedContent.split('\n');
    const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import '));
    
    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex + 1, 0, "import { CONSTANTS } from '../constants/magicNumbers';");
      updatedContent = lines.join('\n');
    }
  }
  
  // Magic Numbers 교체 (정확한 매칭)
  Object.entries(SAFE_MAGIC_NUMBER_MAPPINGS).forEach(([magicNumber, constant]) => {
    // 정확한 숫자 매칭 (문자열 경계 고려)
    const regex = new RegExp(`\\b${magicNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    updatedContent = updatedContent.replace(regex, `CONSTANTS.${constant}`);
  });
  
  return updatedContent;
}

// 안전하지 않은 패턴들을 마스킹
function maskUnsafePatterns(content) {
  const masks = [];
  let maskedContent = content;
  
  UNSAFE_PATTERNS.forEach((pattern, index) => {
    maskedContent = maskedContent.replace(pattern, (match) => {
      const mask = `__MASK_${index}_${masks.length}__`;
      masks.push(match);
      return mask;
    });
  });
  
  return { content: maskedContent, masks };
}

// 마스킹 해제
function unmaskUnsafePatterns(content, masks) {
  let unmaskedContent = content;
  
  masks.forEach((mask, index) => {
    unmaskedContent = unmaskedContent.replace(`__MASK_${index}_${masks.length}__`, mask);
  });
  
  return unmaskedContent;
}

// 파일 처리 함수
function processFile(filePath) {
  try {
    console.log(`📝 처리 중: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = replaceMagicNumbersSafely(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ 완료: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⏭️  변경사항 없음: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 오류 발생: ${path.basename(filePath)}`, error.message);
    return false;
  }
}

// 디렉토리에서 파일들을 찾아서 처리
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { processed: 0, updated: 0 };
  }
  
  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.js') && !file.includes('.test.') && !file.includes('.backup'))
    .map(file => path.join(dirPath, file));
  
  let processed = 0;
  let updated = 0;
  
  files.forEach(filePath => {
    processed++;
    if (processFile(filePath)) {
      updated++;
    }
  });
  
  return { processed, updated };
}

// 메인 실행
function main() {
  console.log('🚀 Magic Numbers → 상수 교체 (안전 모드) 시작...\n');
  
  // 주요 디렉토리들
  const componentDirs = [
    path.join(__dirname, '../src/constants'),
  ];
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  
  componentDirs.forEach(dirPath => {
    console.log(`\n📁 디렉토리: ${path.basename(dirPath)}`);
    const { processed, updated } = processDirectory(dirPath);
    totalProcessed += processed;
    totalUpdated += updated;
  });
  
  console.log(`\n📊 전체 처리 완료:`);
  console.log(`   - 처리된 파일: ${totalProcessed}개`);
  console.log(`   - 업데이트된 파일: ${totalUpdated}개`);
  console.log(`   - 변경사항 없음: ${totalProcessed - totalUpdated}개`);
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { replaceMagicNumbersSafely, processFile };
