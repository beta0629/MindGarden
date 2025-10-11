#!/usr/bin/env node

/**
 * Dashboard 디렉토리 경로 문제를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixDashboardPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // Dashboard 디렉토리 경로 수정 (components 바로 아래에 있음)
    const pathFixes = [
        { from: "'../../common/IPhone17Card'", to: "'../common/IPhone17Card'" },
        { from: '"../../common/IPhone17Card"', to: '"../common/IPhone17Card"' },
        { from: "'../../common/IPhone17Button'", to: "'../common/IPhone17Button'" },
        { from: '"../../common/IPhone17Button"', to: '"../common/IPhone17Button"' },
        { from: "'../../common/IPhone17Modal'", to: "'../common/IPhone17Modal'" },
        { from: '"../../common/IPhone17Modal"', to: '"../common/IPhone17Modal"' },
        { from: "'../../common/IPhone17PageHeader'", to: "'../common/IPhone17PageHeader'" },
        { from: '"../../common/IPhone17PageHeader"', to: '"../common/IPhone17PageHeader"' },
        { from: "'../../common/CommonPageTemplate'", to: "'../common/CommonPageTemplate'" },
        { from: '"../../common/CommonPageTemplate"', to: '"../common/CommonPageTemplate"' },
        { from: "'../../common/UnifiedHeader'", to: "'../common/UnifiedHeader'" },
        { from: '"../../common/UnifiedHeader"', to: '"../common/UnifiedHeader"' },
        { from: "'../../common/UnifiedNotification'", to: "'../common/UnifiedNotification'" },
        { from: '"../../common/UnifiedNotification"', to: '"../common/UnifiedNotification"' }
    ];
    
    for (const fix of pathFixes) {
        if (content.includes(fix.from)) {
            newContent = newContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
            hasChanges = true;
            console.log(`🔄 Dashboard 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Dashboard 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllDashboardPaths() {
    console.log('🔧 Dashboard 디렉토리 경로 문제 수정 시작...\n');
    
    const dashboardDir = path.join(__dirname, '../frontend/src/components/dashboard');
    let totalFiles = 0;
    let fixedFiles = 0;
    
    function processDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                totalFiles++;
                if (fixDashboardPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(dashboardDir);
    
    console.log(`\n📊 Dashboard 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllDashboardPaths();
}

module.exports = { fixDashboardPaths, fixAllDashboardPaths };

