#!/usr/bin/env node

/**
 * 기존 위젯을 표준화된 시스템으로 자동 마이그레이션
 * 
 * BaseWidget과 useWidget을 사용하지 않는 위젯들을 자동으로 변환
 * 
 * 사용법: node scripts/migrate-widgets-to-standard.js [--dry-run] [--widget=위젯이름]
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 명령행 인수 파싱
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const specificWidget = args.find(arg => arg.startsWith('--widget='))?.split('=')[1];

console.log('🔄 위젯 표준화 마이그레이션 시작');
console.log(`모드: ${isDryRun ? 'DRY RUN (실제 변경 안함)' : 'LIVE (실제 변경함)'}`);

// 위젯 디렉토리들
const widgetDirs = [
  'frontend/src/components/dashboard/widgets',
  'frontend/src/components/dashboard/widgets/admin',
  'frontend/src/components/dashboard/widgets/consultation',
  'frontend/src/components/dashboard/widgets/erp'
];

// 분석 결과 저장
const analysisResults = {
  total: 0,
  needsMigration: [],
  alreadyStandard: [],
  errors: []
};

/**
 * 파일이 표준화되어 있는지 확인
 */
function isStandardized(filePath, content) {
  const hasBaseWidgetImport = content.includes('BaseWidget');
  const hasUseWidgetImport = content.includes('useWidget');
  const hasBaseWidgetUsage = content.includes('<BaseWidget');
  const hasUseWidgetUsage = content.includes('useWidget(');
  
  return {
    hasBaseWidgetImport,
    hasUseWidgetImport,
    hasBaseWidgetUsage,
    hasUseWidgetUsage,
    isFullyStandard: hasBaseWidgetImport && hasUseWidgetImport && hasBaseWidgetUsage && hasUseWidgetUsage
  };
}

/**
 * 위젯 파일 분석
 */
function analyzeWidget(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // BaseWidget.js는 제외
    if (fileName === 'BaseWidget.js') {
      return null;
    }
    
    const analysis = isStandardized(filePath, content);
    
    return {
      filePath,
      fileName,
      content,
      ...analysis
    };
  } catch (error) {
    analysisResults.errors.push({
      filePath,
      error: error.message
    });
    return null;
  }
}

/**
 * 위젯을 표준화된 형태로 마이그레이션
 */
function migrateWidget(analysis) {
  const { filePath, fileName, content } = analysis;
  
  console.log(`\\n🔧 마이그레이션: ${fileName}`);
  
  let newContent = content;
  
  // 1. import 문 추가
  if (!analysis.hasBaseWidgetImport) {
    console.log('  ➕ BaseWidget import 추가');
    
    // 상대 경로 계산
    const relativePath = filePath.includes('/admin/') || 
                        filePath.includes('/consultation/') || 
                        filePath.includes('/erp/') ? '../' : './';
    
    const baseWidgetImport = `import BaseWidget from '${relativePath}BaseWidget';\n`;
    
    // React import 다음에 추가
    newContent = newContent.replace(
      /(import React[^;]*;\n)/,
      `$1${baseWidgetImport}`
    );
  }
  
  if (!analysis.hasUseWidgetImport) {
    console.log('  ➕ useWidget import 추가');
    
    const hookPath = filePath.includes('/admin/') || 
                    filePath.includes('/consultation/') || 
                    filePath.includes('/erp/') ? '../../../../' : '../../../';
    
    const useWidgetImport = `import { useWidget } from '${hookPath}hooks/useWidget';\n`;
    
    // React import 다음에 추가
    newContent = newContent.replace(
      /(import React[^;]*;\n)/,
      `$1${useWidgetImport}`
    );
  }
  
  // 2. WIDGET_CONSTANTS import 추가 (없는 경우)
  if (!content.includes('WIDGET_CONSTANTS')) {
    console.log('  ➕ WIDGET_CONSTANTS import 추가');
    
    const constantsPath = filePath.includes('/admin/') || 
                         filePath.includes('/consultation/') || 
                         filePath.includes('/erp/') ? '../../../../' : '../../../';
    
    const constantsImport = `import { WIDGET_CONSTANTS } from '${constantsPath}constants/widgetConstants';\n`;
    
    newContent = newContent.replace(
      /(import React[^;]*;\n)/,
      `$1${constantsImport}`
    );
  }
  
  // 3. useWidget 훅 사용 추가
  if (!analysis.hasUseWidgetUsage) {
    console.log('  ➕ useWidget 훅 사용 추가');
    
    const useWidgetCode = `
  // ✅ 표준화된 위젯 훅 사용 (자동 추가됨)
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });
`;
    
    // 컴포넌트 함수 시작 부분에 추가
    newContent = newContent.replace(
      /(const \w+Widget = \([^)]*\) => \{)/,
      `$1${useWidgetCode}`
    );
  }
  
  // 4. BaseWidget 래핑 (기존 JSX를 BaseWidget으로 감싸기)
  if (!analysis.hasBaseWidgetUsage) {
    console.log('  🔄 BaseWidget으로 래핑');
    
    // return 문 찾기 및 BaseWidget으로 래핑
    const returnMatch = newContent.match(/(return \([\s\S]*?\);\s*\}\s*;\s*export)/);
    if (returnMatch) {
      const originalReturn = returnMatch[1];
      const wrappedReturn = `return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      onRefresh={refresh}
    >
      {/* 기존 내용을 BaseWidget으로 래핑 (자동 마이그레이션) */}
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_CONTENT}>
        {/* TODO: 기존 JSX를 여기로 이동하고 정리하세요 */}
        <p>⚠️ 이 위젯은 자동으로 마이그레이션되었습니다. 내용을 검토하고 정리해주세요.</p>
      </div>
    </BaseWidget>
  );`;
      
      newContent = newContent.replace(returnMatch[0], wrappedReturn + '\n\nexport');
    }
  }
  
  // 5. 파일 헤더 주석 업데이트
  if (!content.includes('@author MindGarden')) {
    console.log('  📝 파일 헤더 업데이트');
    
    const headerComment = `/**
 * ${fileName.replace('.js', '')}
 * 
 * ⚠️ 자동 마이그레이션된 위젯 (${new Date().toISOString().split('T')[0]})
 * - BaseWidget 사용으로 변경됨
 * - useWidget 훅 사용으로 변경됨
 * - 수동 검토 및 정리 필요
 * 
 * TODO: 마이그레이션 후 수동 검토 필요
 * 1. 기존 로직이 올바르게 동작하는지 확인
 * 2. CSS 클래스를 WIDGET_CONSTANTS로 변경
 * 3. 불필요한 코드 제거
 * 
 * @author MindGarden (자동 마이그레이션)
 * @version 1.0.0
 * @since ${new Date().toISOString().split('T')[0]}
 */

`;
    
    // 기존 주석 제거하고 새 헤더 추가
    newContent = newContent.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '');
    newContent = headerComment + newContent;
  }
  
  return newContent;
}

/**
 * 모든 위젯 파일 스캔
 */
function scanAllWidgets() {
  console.log('\\n📂 위젯 파일 스캔 중...');
  
  for (const dir of widgetDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ 디렉토리 없음: ${dir}`);
      continue;
    }
    
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('Widget.js') && !file.includes('.backup.'))
      .filter(file => !specificWidget || file === `${specificWidget}.js`);
    
    console.log(`📁 ${dir}: ${files.length}개 파일`);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const analysis = analyzeWidget(filePath);
      
      if (analysis) {
        analysisResults.total++;
        
        if (analysis.isFullyStandard) {
          analysisResults.alreadyStandard.push(analysis);
          console.log(`  ✅ ${file}: 이미 표준화됨`);
        } else {
          analysisResults.needsMigration.push(analysis);
          console.log(`  ⚠️ ${file}: 마이그레이션 필요`);
        }
      }
    }
  }
}

/**
 * 마이그레이션 실행
 */
function runMigration() {
  console.log(`\\n🚀 마이그레이션 실행 (${analysisResults.needsMigration.length}개 파일)`);
  
  for (const analysis of analysisResults.needsMigration) {
    try {
      const newContent = migrateWidget(analysis);
      
      if (!isDryRun) {
        // 백업 생성
        const backupPath = `${analysis.filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, analysis.content);
        console.log(`  💾 백업 생성: ${path.basename(backupPath)}`);
        
        // 새 내용 저장
        fs.writeFileSync(analysis.filePath, newContent);
        console.log(`  ✅ 마이그레이션 완료: ${analysis.fileName}`);
      } else {
        console.log(`  🔍 DRY RUN: ${analysis.fileName} (실제 변경 안함)`);
      }
    } catch (error) {
      console.error(`  ❌ 마이그레이션 실패: ${analysis.fileName}`, error.message);
      analysisResults.errors.push({
        filePath: analysis.filePath,
        error: error.message
      });
    }
  }
}

/**
 * 결과 리포트 출력
 */
function printReport() {
  console.log('\\n📊 마이그레이션 결과 리포트');
  console.log('='.repeat(50));
  console.log(`총 위젯 파일: ${analysisResults.total}개`);
  console.log(`이미 표준화됨: ${analysisResults.alreadyStandard.length}개`);
  console.log(`마이그레이션 필요: ${analysisResults.needsMigration.length}개`);
  console.log(`오류 발생: ${analysisResults.errors.length}개`);
  
  if (analysisResults.needsMigration.length > 0) {
    console.log('\\n📋 마이그레이션 대상:');
    for (const analysis of analysisResults.needsMigration) {
      console.log(`  - ${analysis.fileName}`);
      if (!analysis.hasBaseWidgetImport) console.log('    ❌ BaseWidget import 없음');
      if (!analysis.hasUseWidgetImport) console.log('    ❌ useWidget import 없음');
      if (!analysis.hasBaseWidgetUsage) console.log('    ❌ BaseWidget 사용 안함');
      if (!analysis.hasUseWidgetUsage) console.log('    ❌ useWidget 사용 안함');
    }
  }
  
  if (analysisResults.errors.length > 0) {
    console.log('\\n❌ 오류 발생:');
    for (const error of analysisResults.errors) {
      console.log(`  - ${error.filePath}: ${error.error}`);
    }
  }
  
  if (!isDryRun && analysisResults.needsMigration.length > 0) {
    console.log('\\n📋 다음 단계:');
    console.log('1. 마이그레이션된 위젯들을 수동으로 검토하세요');
    console.log('2. TODO 주석을 확인하고 필요한 수정을 하세요');
    console.log('3. 테스트를 실행하여 동작을 확인하세요');
    console.log('4. ESLint를 실행하여 표준 준수를 확인하세요');
    console.log('\\n명령어:');
    console.log('  npm test');
    console.log('  npm run lint');
  }
}

// 메인 실행
try {
  scanAllWidgets();
  
  if (analysisResults.needsMigration.length > 0) {
    runMigration();
  } else {
    console.log('\\n🎉 모든 위젯이 이미 표준화되어 있습니다!');
  }
  
  printReport();
  
} catch (error) {
  console.error('❌ 마이그레이션 중 치명적 오류:', error.message);
  process.exit(1);
}
