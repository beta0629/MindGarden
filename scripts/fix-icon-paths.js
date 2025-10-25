#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 잘못된 경로를 올바른 경로로 매핑
const pathMappings = {
  // auth 폴더
  'frontend/src/components/auth/AccountIntegrationModal.js': '../../constants/icons',
  
  // erp/refund 폴더  
  'frontend/src/components/erp/refund/RefundFilters.js': '../../../constants/icons',
  
  // hq 폴더들
  'frontend/src/components/hq/BranchDetail.js': '../../constants/icons',
  'frontend/src/components/hq/BranchForm.js': '../../constants/icons',
  'frontend/src/components/hq/BranchList.js': '../../constants/icons',
  'frontend/src/components/hq/BranchManagement.js': '../../constants/icons',
  'frontend/src/components/hq/BranchRegistrationModal.js': '../../constants/icons',
  'frontend/src/components/hq/BranchStatisticsDashboard.js': '../../constants/icons',
  'frontend/src/components/hq/BranchUserTransfer.js': '../../constants/icons',
  'frontend/src/components/hq/ConsolidatedFinancial.js': '../../constants/icons',
  'frontend/src/components/hq/FinancialReports.js': '../../constants/icons',
  'frontend/src/components/hq/HQBranchManagement.js': '../../constants/icons',
  
  // admin 폴더들
  'frontend/src/components/admin/ClientComprehensiveManagement.js': '../../constants/icons',
  'frontend/src/components/admin/ConsultantComprehensiveManagement.js': '../../constants/icons',
  'frontend/src/components/admin/ConsultantManagement.js': '../../constants/icons',
  'frontend/src/components/admin/StatisticsDashboard.js': '../../constants/icons',
  'frontend/src/components/admin/TodayStatistics.js': '../../constants/icons',
  'frontend/src/components/admin/UserManagement.js': '../../constants/icons',
  'frontend/src/components/admin/VacationStatistics.js': '../../constants/icons',
  'frontend/src/components/admin/system/SystemStatus.js': '../../../constants/icons',
  
  // erp 폴더
  'frontend/src/components/erp/RefundManagement.js': '../../constants/icons',
  
  // pages 폴더
  'frontend/src/pages/ComponentTestPage.js': '../constants/icons'
};

// 파일 처리 함수
function fixIconPaths() {
  console.log('🔧 아이콘 경로 수정 시작...\n');
  
  for (const [filePath, correctPath] of Object.entries(pathMappings)) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
        continue;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 잘못된 경로 패턴 찾기 (매우 긴 ../ 경로)
      const wrongPathPattern = /import\s*{\s*ICONS,\s*ICON_SIZES,\s*ICON_COLORS\s*}\s*from\s*['"][^'"]*\.\.\/[^'"]*constants\/icons['"];?/g;
      
      if (wrongPathPattern.test(content)) {
        const newContent = content.replace(wrongPathPattern, `import { ICONS, ICON_SIZES, ICON_COLORS } from '${correctPath}';`);
        
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`✅ 수정 완료: ${filePath}`);
        } else {
          console.log(`⏭️  변경사항 없음: ${filePath}`);
        }
      } else {
        console.log(`⏭️  잘못된 경로 없음: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ 오류 발생: ${filePath}`, error.message);
    }
  }
  
  console.log('\n✅ 모든 파일 처리 완료!');
}

// 메인 실행
fixIconPaths();
