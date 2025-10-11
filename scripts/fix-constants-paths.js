#!/usr/bin/env node

/**
 * constants 경로 오류를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixConstantsPaths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // constants 경로 수정 패턴들
    const pathFixes = [
        // utils에서 constants로 가는 경로
        { from: "./constants/api", to: "../constants/api" },
        { from: "./constants/account", to: "../constants/account" },
        { from: "./constants/oauth2", to: "../constants/oauth2" },
        { from: "./constants/pageConfigs", to: "../constants/pageConfigs" },
        { from: "./constants/css-variables", to: "../constants/css-variables" },
        
        // 기타 상위 경로 수정
        { from: "./constants/", to: "../constants/" },
        { from: "./utils/", to: "../utils/" },
        { from: "./hooks/", to: "../hooks/" },
        { from: "./common/", to: "../common/" }
    ];
    
    for (const fix of pathFixes) {
        const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (content.includes(fix.from)) {
            newContent = newContent.replace(regex, fix.to);
            hasChanges = true;
            console.log(`🔄 경로 수정: ${fix.from} → ${fix.to} in ${filePath}`);
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ constants 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllConstantsPaths() {
    console.log('🔧 constants 경로 수정 시작...\n');
    
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
                if (fixConstantsPaths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 constants 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllConstantsPaths();
}

module.exports = { fixConstantsPaths, fixAllConstantsPaths };

