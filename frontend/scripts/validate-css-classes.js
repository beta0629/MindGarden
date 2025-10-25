#!/bin/sh

# MindGarden 디자인 시스템 v2.0 CSS 검증 스크립트
# CSS 클래스 중복 및 네이밍 규칙 검증

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 정의
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// CSS 레지스트리 파일 경로
const CSS_REGISTRY_PATH = 'src/constants/cssRegistry.js';

// 검증 결과
let errorCount = 0;
let warningCount = 0;

/**
 * CSS 레지스트리 로드
 */
function loadCSSRegistry() {
  try {
    if (fs.existsSync(CSS_REGISTRY_PATH)) {
      delete require.cache[require.resolve(path.resolve(CSS_REGISTRY_PATH))];
      return require(path.resolve(CSS_REGISTRY_PATH));
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ CSS 레지스트리를 로드할 수 없습니다: ${error.message}${colors.reset}`);
  }
  
  return {
    EXISTING: [],
    NEW: [],
    RESERVED: []
  };
}

/**
 * CSS 파일에서 클래스 추출
 */
function extractCSSClasses(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return [...new Set(classes)]; // 중복 제거
  } catch (error) {
    console.log(`${colors.red}❌ 파일 읽기 실패: ${filePath}${colors.reset}`);
    return [];
  }
}

/**
 * JavaScript 파일에서 CSS 클래스 추출
 */
function extractJSClasses(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const classRegex = /className[=:]\s*['"`]([^'"`]+)['"`]/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const classString = match[1];
      const classList = classString.split(/\s+/).filter(cls => cls.trim());
      classes.push(...classList);
    }
    
    return [...new Set(classes)]; // 중복 제거
  } catch (error) {
    console.log(`${colors.red}❌ 파일 읽기 실패: ${filePath}${colors.reset}`);
    return [];
  }
}

/**
 * 모든 파일에서 CSS 클래스 스캔
 */
function scanAllCSSClasses() {
  const allClasses = new Set();
  const fileClasses = new Map();
  
  // CSS 파일 스캔
  const cssFiles = execSync('find src -name "*.css" -o -name "*.scss"', { encoding: 'utf8' })
    .trim().split('\n').filter(file => file);
  
  cssFiles.forEach(file => {
    const classes = extractCSSClasses(file);
    classes.forEach(cls => allClasses.add(cls));
    fileClasses.set(file, classes);
  });
  
  // JavaScript 파일 스캔
  const jsFiles = execSync('find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
    .trim().split('\n').filter(file => file);
  
  jsFiles.forEach(file => {
    const classes = extractJSClasses(file);
    classes.forEach(cls => allClasses.add(cls));
    if (fileClasses.has(file)) {
      const existing = fileClasses.get(file);
      fileClasses.set(file, [...existing, ...classes]);
    } else {
      fileClasses.set(file, classes);
    }
  });
  
  return { allClasses: Array.from(allClasses), fileClasses };
}

/**
 * CSS 클래스 검증
 */
function validateCSSClasses(classes, registry) {
  const errors = [];
  const warnings = [];
  
  classes.forEach(className => {
    // 1. 네이밍 규칙 검증
    if (!className.startsWith('mg-') && !className.startsWith('mg-v2-')) {
      if (className.length > 3) { // 너무 짧은 클래스명은 제외
        warnings.push({
          type: 'naming',
          message: `클래스 '${className}'이 mg- 또는 mg-v2- 접두사를 사용하지 않습니다.`,
          className
        });
      }
    }
    
    // 2. 레거시 클래스와 충돌 검사
    if (className.startsWith('mg-') && !className.startsWith('mg-v2-')) {
      if (registry.EXISTING.includes(className)) {
        errors.push({
          type: 'conflict',
          message: `클래스 '${className}'이 레거시 클래스와 충돌합니다. mg-v2- 접두사를 사용하세요.`,
          className
        });
      }
    }
    
    // 3. 예약어 검사
    if (registry.RESERVED.some(reserved => className.includes(reserved))) {
      errors.push({
        type: 'reserved',
        message: `클래스 '${className}'이 예약어를 포함합니다.`,
        className
      });
    }
    
    // 4. 중복 검사
    const duplicates = classes.filter(cls => cls === className);
    if (duplicates.length > 1) {
      errors.push({
        type: 'duplicate',
        message: `클래스 '${className}'이 중복 정의되었습니다.`,
        className
      });
    }
  });
  
  return { errors, warnings };
}

/**
 * CSS 레지스트리 업데이트
 */
function updateCSSRegistry(allClasses, registry) {
  const newClasses = allClasses.filter(cls => 
    !registry.EXISTING.includes(cls) && 
    !registry.NEW.includes(cls)
  );
  
  const updatedRegistry = {
    ...registry,
    NEW: [...registry.NEW, ...newClasses]
  };
  
  // 레지스트리 파일 업데이트
  const registryContent = `/**
 * CSS 클래스 레지스트리
 * 자동 생성됨 - 수동 수정 금지
 */

export const CSS_REGISTRY = {
  // 기존 클래스 (레거시)
  EXISTING: ${JSON.stringify(updatedRegistry.EXISTING, null, 2)},
  
  // 새 클래스 (v2.0)
  NEW: ${JSON.stringify(updatedRegistry.NEW, null, 2)},
  
  // 예약어
  RESERVED: ${JSON.stringify(updatedRegistry.RESERVED, null, 2)}
};

export default CSS_REGISTRY;
`;
  
  try {
    fs.writeFileSync(CSS_REGISTRY_PATH, registryContent);
    console.log(`${colors.green}✅ CSS 레지스트리가 업데이트되었습니다.${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ CSS 레지스트리 업데이트 실패: ${error.message}${colors.reset}`);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log(`${colors.blue}🔍 CSS 클래스 검증 시작...${colors.reset}`);
  
  // CSS 레지스트리 로드
  const registry = loadCSSRegistry();
  
  // 모든 CSS 클래스 스캔
  const { allClasses, fileClasses } = scanAllCSSClasses();
  
  console.log(`${colors.blue}📊 발견된 클래스: ${allClasses.length}개${colors.reset}`);
  
  // 클래스 검증
  const { errors, warnings } = validateCSSClasses(allClasses, registry);
  
  // 결과 출력
  if (errors.length > 0) {
    console.log(`${colors.red}❌ 오류 (${errors.length}개):${colors.reset}`);
    errors.forEach(error => {
      console.log(`  - ${error.message}`);
      errorCount++;
    });
  }
  
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️ 경고 (${warnings.length}개):${colors.reset}`);
    warnings.forEach(warning => {
      console.log(`  - ${warning.message}`);
      warningCount++;
    });
  }
  
  // CSS 레지스트리 업데이트
  updateCSSRegistry(allClasses, registry);
  
  // 결과 요약
  console.log('');
  if (errorCount === 0 && warningCount === 0) {
    console.log(`${colors.green}🎉 모든 CSS 클래스가 검증을 통과했습니다!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ 검증 실패: 오류 ${errorCount}개, 경고 ${warningCount}개${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}💡 해결 방법:${colors.reset}`);
    console.log('1. mg-v2- 접두사를 사용하세요');
    console.log('2. 레거시 클래스와 충돌하지 않도록 주의하세요');
    console.log('3. 예약어 사용을 피하세요');
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  loadCSSRegistry,
  extractCSSClasses,
  extractJSClasses,
  scanAllCSSClasses,
  validateCSSClasses,
  updateCSSRegistry
};
