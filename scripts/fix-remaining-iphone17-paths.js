#!/usr/bin/env node

/**
 * 남은 IPhone17Card 경로 문제를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixRemainingIPhone17Paths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // IPhone17 컴포넌트 경로 수정
    const pathFixes = [
        { from: "'../common/IPhone17Card'", to: "'../../common/IPhone17Card'" },
        { from: '"../common/IPhone17Card"', to: '"../../common/IPhone17Card"' },
        { from: "'../common/IPhone17Button'", to: "'../../common/IPhone17Button'" },
        { from: '"../common/IPhone17Button"', to: '"../../common/IPhone17Button"' },
        { from: "'../common/IPhone17Modal'", to: "'../../common/IPhone17Modal'" },
        { from: '"../common/IPhone17Modal"', to: '"../../common/IPhone17Modal"' },
        { from: "'../common/IPhone17PageHeader'", to: "'../../common/IPhone17PageHeader'" },
        { from: '"../common/IPhone17PageHeader"', to: '"../../common/IPhone17PageHeader"' },
        { from: "'../common/CommonPageTemplate'", to: "'../../common/CommonPageTemplate'" },
        { from: '"../common/CommonPageTemplate"', to: '"../../common/CommonPageTemplate"' },
        { from: "'../common/UnifiedHeader'", to: "'../../common/UnifiedHeader'" },
        { from: '"../common/UnifiedHeader"', to: '"../../common/UnifiedHeader"' },
        { from: "'../common/UnifiedNotification'", to: "'../../common/UnifiedNotification'" },
        { from: '"../common/UnifiedNotification"', to: '"../../common/UnifiedNotification"' },
        
        // 3단계 깊이용
        { from: "'../../common/IPhone17Card'", to: "'../../../common/IPhone17Card'" },
        { from: '"../../common/IPhone17Card"', to: '"../../../common/IPhone17Card"' },
        { from: "'../../common/IPhone17Button'", to: "'../../../common/IPhone17Button'" },
        { from: '"../../common/IPhone17Button"', to: '"../../../common/IPhone17Button"' },
        { from: "'../../common/IPhone17Modal'", to: "'../../../common/IPhone17Modal'" },
        { from: '"../../common/IPhone17Modal"', to: '"../../../common/IPhone17Modal"' },
        { from: "'../../common/IPhone17PageHeader'", to: "'../../../common/IPhone17PageHeader'" },
        { from: '"../../common/IPhone17PageHeader"', to: '"../../../common/IPhone17PageHeader"' },
        { from: "'../../common/CommonPageTemplate'", to: "'../../../common/CommonPageTemplate'" },
        { from: '"../../common/CommonPageTemplate"', to: '"../../../common/CommonPageTemplate"' },
        { from: "'../../common/UnifiedHeader'", to: "'../../../common/UnifiedHeader'" },
        { from: '"../../common/UnifiedHeader"', to: '"../../../common/UnifiedHeader"' },
        { from: "'../../common/UnifiedNotification'", to: "'../../../common/UnifiedNotification'" },
        { from: '"../../common/UnifiedNotification"', to: '"../../../common/UnifiedNotification"' }
    ];
    
    for (const fix of pathFixes) {
        if (content.includes(fix.from)) {
            newContent = newContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
            hasChanges = true;
            console.log(`🔄 IPhone17 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ IPhone17 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllRemainingIPhone17Paths() {
    console.log('🔧 남은 IPhone17 컴포넌트 경로 문제 수정 시작...\n');
    
    const srcDir = path.join(__dirname, '../frontend/src');
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
                if (fixRemainingIPhone17Paths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 남은 IPhone17 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllRemainingIPhone17Paths();
}

module.exports = { fixRemainingIPhone17Paths, fixAllRemainingIPhone17Paths };

