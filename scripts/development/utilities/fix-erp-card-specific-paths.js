#!/usr/bin/env node

/**
 * ErpCard 특정 경로 문제를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixErpCardSpecificPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // ErpCard 관련 경로 수정
    const pathFixes = [
        { from: "'../common/ErpCard'", to: "'./common/ErpCard'" },
        { from: '"../common/ErpCard"', to: '"./common/ErpCard"' },
        { from: "'../common/ErpButton'", to: "'./common/ErpButton'" },
        { from: '"../common/ErpButton"', to: '"./common/ErpButton"' },
        { from: "'../common/ErpHeader'", to: "'./common/ErpHeader'" },
        { from: '"../common/ErpHeader"', to: '"./common/ErpHeader"' },
        { from: "'../common/ErpModal'", to: "'./common/ErpModal'" },
        { from: '"../common/ErpModal"', to: '"./common/ErpModal"' }
    ];
    
    for (const fix of pathFixes) {
        if (content.includes(fix.from)) {
            newContent = newContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
            hasChanges = true;
            console.log(`🔄 ErpCard 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ ErpCard 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllErpCardSpecificPaths() {
    console.log('🔧 ErpCard 특정 경로 문제 수정 시작...\n');
    
    const erpDir = path.join(__dirname, '../frontend/src/components/erp');
    let totalFiles = 0;
    let fixedFiles = 0;
    
    function processDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && item !== 'common') {
                processDirectory(fullPath);
            } else if (item.endsWith('.js') && item !== 'ErpCard.js' && item !== 'ErpButton.js' && item !== 'ErpHeader.js' && item !== 'ErpModal.js') {
                totalFiles++;
                if (fixErpCardSpecificPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(erpDir);
    
    console.log(`\n📊 ErpCard 특정 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllErpCardSpecificPaths();
}

module.exports = { fixErpCardSpecificPaths, fixAllErpCardSpecificPaths };

