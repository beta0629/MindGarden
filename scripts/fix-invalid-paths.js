#!/usr/bin/env node

/**
 * 잘못된 경로 패턴을 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixInvalidPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // 잘못된 경로 패턴 수정
    const pathFixes = [
        // 잘못된 경로 패턴들
        { from: "../.../constants/api", to: "../../constants/api" },
        { from: "../.../constants/", to: "../../constants/" },
        { from: "../.../utils/", to: "../../utils/" },
        { from: "../.../common/", to: "../../common/" },
        { from: "../.../hooks/", to: "../../hooks/" },
        
        // 기타 잘못된 패턴들
        { from: "../.../", to: "../../" },
        { from: "../...", to: "../.." }
    ];
    
    for (const fix of pathFixes) {
        if (content.includes(fix.from)) {
            newContent = newContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
            hasChanges = true;
            console.log(`🔄 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ 잘못된 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllInvalidPaths() {
    console.log('🔧 잘못된 경로 패턴 수정 시작...\n');
    
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
                if (fixInvalidPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 잘못된 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllInvalidPaths();
}

module.exports = { fixInvalidPaths, fixAllInvalidPaths };

