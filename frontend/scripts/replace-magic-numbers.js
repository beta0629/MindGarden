#!/usr/bin/env node

/**
 * Magic Numbers를 상수로 교체하는 스크립트
 */

const fs = require('fs');
const path = require('path');

// 상수 매핑 테이블
const MAGIC_NUMBER_MAPPINGS = {
  // 시간 관련 (밀리초)
  '1000': 'TIME_CONSTANTS.SECOND',
  '60 * 1000': 'TIME_CONSTANTS.MINUTE',
  '60 * 60 * 1000': 'TIME_CONSTANTS.HOUR',
  '24 * 60 * 60 * 1000': 'TIME_CONSTANTS.DAY',
  '7 * 24 * 60 * 60 * 1000': 'TIME_CONSTANTS.WEEK',
  '30 * 24 * 60 * 60 * 1000': 'TIME_CONSTANTS.MONTH',
  '365 * 24 * 60 * 60 * 1000': 'TIME_CONSTANTS.YEAR',
  
  // 특정 시간 간격
  '5 * 1000': 'TIME_CONSTANTS.LOGIN_CHECK_DELAY',
  '10 * 1000': 'TIME_CONSTANTS.AUTO_SAVE_INTERVAL',
  '30 * 1000': 'TIME_CONSTANTS.REQUEST_TIMEOUT',
  '300': 'TIME_CONSTANTS.DEBOUNCE_DELAY',
  '1000': 'TIME_CONSTANTS.THROTTLE_DELAY',
  '3000': 'TIME_CONSTANTS.NOTIFICATION_DURATION',
  '5000': 'TIME_CONSTANTS.ERROR_NOTIFICATION_DURATION',
  '4000': 'TIME_CONSTANTS.WARNING_NOTIFICATION_DURATION',
  '30000': 'TIME_CONSTANTS.POLLING_INTERVAL',
  '60000': 'TIME_CONSTANTS.LONG_POLLING_INTERVAL',
  '600000': 'TIME_CONSTANTS.SESSION_TIMEOUT',
  
  // HTTP 상태 코드
  '200': 'HTTP_STATUS.OK',
  '201': 'HTTP_STATUS.CREATED',
  '204': 'HTTP_STATUS.NO_CONTENT',
  '400': 'HTTP_STATUS.BAD_REQUEST',
  '401': 'HTTP_STATUS.UNAUTHORIZED',
  '403': 'HTTP_STATUS.FORBIDDEN',
  '404': 'HTTP_STATUS.NOT_FOUND',
  '409': 'HTTP_STATUS.CONFLICT',
  '422': 'HTTP_STATUS.UNPROCESSABLE_ENTITY',
  '500': 'HTTP_STATUS.INTERNAL_SERVER_ERROR',
  '503': 'HTTP_STATUS.SERVICE_UNAVAILABLE',
  
  // UI 관련
  '44': 'UI_CONSTANTS.MIN_TOUCH_TARGET_SIZE',
  '768': 'UI_CONSTANTS.MAX_MOBILE_WIDTH',
  '1024': 'UI_CONSTANTS.MAX_TABLET_WIDTH',
  '1200': 'UI_CONSTANTS.MAX_DESKTOP_WIDTH',
  '100': 'UI_CONSTANTS.SCROLL_THRESHOLD',
  '200': 'UI_CONSTANTS.INFINITE_SCROLL_THRESHOLD',
  '1000': 'UI_CONSTANTS.MODAL_Z_INDEX',
  '1100': 'UI_CONSTANTS.TOOLTIP_Z_INDEX',
  '1200': 'UI_CONSTANTS.DROPDOWN_Z_INDEX',
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
  '10 * 1024 * 1024': 'BUSINESS_CONSTANTS.MAX_FILE_SIZE',
  '5 * 1024 * 1024': 'BUSINESS_CONSTANTS.MAX_IMAGE_SIZE',
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
  '100': 'MATH_CONSTANTS.MAX_DISCOUNT_PERCENTAGE',
  '0': 'MATH_CONSTANTS.MIN_DISCOUNT_PERCENTAGE',
  
  // 데이터베이스 관련
  '20': 'DATABASE_CONSTANTS.DEFAULT_LIMIT',
  '1000': 'DATABASE_CONSTANTS.MAX_LIMIT',
  '1000': 'DATABASE_CONSTANTS.MAX_QUERY_LENGTH',
  '100': 'DATABASE_CONSTANTS.MAX_BATCH_SIZE',
  '5 * 60 * 1000': 'DATABASE_CONSTANTS.CACHE_TTL',
  '30 * 60 * 1000': 'DATABASE_CONSTANTS.LONG_CACHE_TTL',
  '1 * 60 * 1000': 'DATABASE_CONSTANTS.SHORT_CACHE_TTL',
  
  // 보안 관련
  '8': 'SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH',
  '128': 'SECURITY_CONSTANTS.MAX_PASSWORD_LENGTH',
  '15 * 60 * 1000': 'SECURITY_CONSTANTS.ACCESS_TOKEN_EXPIRY',
  '7 * 24 * 60 * 60 * 1000': 'SECURITY_CONSTANTS.REFRESH_TOKEN_EXPIRY',
  '5': 'SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS',
  '15 * 60 * 1000': 'SECURITY_CONSTANTS.LOCKOUT_DURATION',
  '30 * 60 * 1000': 'SECURITY_CONSTANTS.SESSION_TIMEOUT',
  '5 * 60 * 1000': 'SECURITY_CONSTANTS.SESSION_EXTENSION_TIME',
  
  // API 관련
  '30 * 1000': 'API_CONSTANTS.REQUEST_TIMEOUT',
  '5 * 60 * 1000': 'API_CONSTANTS.UPLOAD_TIMEOUT',
  '3': 'API_CONSTANTS.MAX_RETRY_ATTEMPTS',
  '1000': 'API_CONSTANTS.RETRY_DELAY',
  '2': 'API_CONSTANTS.EXPONENTIAL_BACKOFF_MULTIPLIER',
  '100': 'API_CONSTANTS.BATCH_SIZE',
  '1000': 'API_CONSTANTS.MAX_BATCH_SIZE',
  '5 * 60 * 1000': 'API_CONSTANTS.CACHE_DURATION',
  '1 * 60 * 1000': 'API_CONSTANTS.STALE_WHILE_REVALIDATE',
  
  // 폼 관련
  '1': 'FORM_CONSTANTS.MIN_INPUT_LENGTH',
  '255': 'FORM_CONSTANTS.MAX_INPUT_LENGTH',
  '2000': 'FORM_CONSTANTS.MAX_TEXTAREA_LENGTH',
  '500': 'FORM_CONSTANTS.MAX_COMMENT_LENGTH',
  '10': 'FORM_CONSTANTS.MAX_FILES_PER_UPLOAD',
  '255': 'FORM_CONSTANTS.MAX_FILE_NAME_LENGTH',
  
  // 차트 관련
  '300': 'CHART_CONSTANTS.DEFAULT_CHART_HEIGHT',
  '200': 'CHART_CONSTANTS.MIN_CHART_HEIGHT',
  '600': 'CHART_CONSTANTS.MAX_CHART_HEIGHT',
  '1000': 'CHART_CONSTANTS.ANIMATION_DURATION',
  '100': 'CHART_CONSTANTS.ANIMATION_DELAY',
  '1000': 'CHART_CONSTANTS.MAX_DATA_POINTS',
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

// Magic Numbers를 상수로 교체하는 함수
function replaceMagicNumbers(content) {
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
  Object.entries(MAGIC_NUMBER_MAPPINGS).forEach(([magicNumber, constant]) => {
    // 정확한 숫자 매칭 (문자열 경계 고려)
    const regex = new RegExp(`\\b${magicNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    updatedContent = updatedContent.replace(regex, `CONSTANTS.${constant}`);
  });
  
  // 특별한 패턴들 처리
  // 시간 관련 패턴 (예: 5 * 60 * 1000)
  updatedContent = updatedContent.replace(/(\d+)\s*\*\s*60\s*\*\s*1000/g, (match, minutes) => {
    const totalMs = parseInt(minutes) * 60 * 1000;
    if (MAGIC_NUMBER_MAPPINGS[totalMs.toString()]) {
      return `CONSTANTS.${MAGIC_NUMBER_MAPPINGS[totalMs.toString()]}`;
    }
    return match;
  });
  
  // 분 단위 패턴 (예: 30 * 1000)
  updatedContent = updatedContent.replace(/(\d+)\s*\*\s*1000/g, (match, seconds) => {
    const totalMs = parseInt(seconds) * 1000;
    if (MAGIC_NUMBER_MAPPINGS[totalMs.toString()]) {
      return `CONSTANTS.${MAGIC_NUMBER_MAPPINGS[totalMs.toString()]}`;
    }
    return match;
  });
  
  // 시간 단위 패턴 (예: 60 * 60 * 1000)
  updatedContent = updatedContent.replace(/(\d+)\s*\*\s*60\s*\*\s*60\s*\*\s*1000/g, (match, hours) => {
    const totalMs = parseInt(hours) * 60 * 60 * 1000;
    if (MAGIC_NUMBER_MAPPINGS[totalMs.toString()]) {
      return `CONSTANTS.${MAGIC_NUMBER_MAPPINGS[totalMs.toString()]}`;
    }
    return match;
  });
  
  // 파일 크기 패턴 (예: 10 * 1024 * 1024)
  updatedContent = updatedContent.replace(/(\d+)\s*\*\s*1024\s*\*\s*1024/g, (match, mb) => {
    const totalBytes = parseInt(mb) * 1024 * 1024;
    if (MAGIC_NUMBER_MAPPINGS[totalBytes.toString()]) {
      return `CONSTANTS.${MAGIC_NUMBER_MAPPINGS[totalBytes.toString()]}`;
    }
    return match;
  });
  
  return updatedContent;
}

// 파일 처리 함수
function processFile(filePath) {
  try {
    console.log(`📝 처리 중: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = replaceMagicNumbers(content);
    
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
  console.log('🚀 Magic Numbers → 상수 교체 시작...\n');
  
  // 주요 디렉토리들
  const componentDirs = [
    path.join(__dirname, '../src/components'),
    path.join(__dirname, '../src/utils'),
    path.join(__dirname, '../src/contexts'),
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

module.exports = { replaceMagicNumbers, processFile };
