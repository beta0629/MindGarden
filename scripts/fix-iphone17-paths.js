#!/usr/bin/env node

/**
 * IPhone17Card 경로 문제를 수정하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function fixIPhone17Paths(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // IPhone17 컴포넌트 경로 수정
    const pathFixes = [
        // IPhone17 컴포넌트들
        { from: "./common/IPhone17Card", to: "../common/IPhone17Card" },
        { from: "./common/IPhone17Button", to: "../common/IPhone17Button" },
        { from: "./common/IPhone17Modal", to: "../common/IPhone17Modal" },
        { from: "./common/IPhone17PageHeader", to: "../common/IPhone17PageHeader" },
        
        // Common 컴포넌트들
        { from: "./common/CommonPageTemplate", to: "../common/CommonPageTemplate" },
        { from: "./common/UnifiedHeader", to: "../common/UnifiedHeader" },
        { from: "./common/UnifiedNotification", to: "../common/UnifiedNotification" },
        
        // 기타 common 경로들
        { from: "./common/", to: "../common/" }
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
        console.log(`✅ IPhone17 경로 수정 완료: ${filePath}`);
        return true;
    }
    
    return false;
}

function fixAllIPhone17Paths() {
    console.log('🔧 IPhone17 컴포넌트 경로 문제 수정 시작...\n');
    
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
                if (fixIPhone17Paths(fullPath)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    processDirectory(srcDir);
    
    console.log(`\n📊 IPhone17 경로 수정 완료!`);
    console.log(`📁 총 파일 수: ${totalFiles}`);
    console.log(`✅ 수정된 파일: ${fixedFiles}`);
    console.log(`⏭️  변경사항 없는 파일: ${totalFiles - fixedFiles}`);
}

// 스크립트 실행
if (require.main === module) {
    fixAllIPhone17Paths();
}

module.exports = { fixIPhone17Paths, fixAllIPhone17Paths };

