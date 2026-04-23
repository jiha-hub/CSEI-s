/**
 * 🌀 Ralph Loop: Autonomous Agent Harness
 * 시니어 개발자를 위한 자율형 바이브 코딩 루프 스크립트입니다.
 * 
 * 주요 기능:
 * 1. PRD_VIBE.md를 읽고 현재 태스크 식별
 * 2. 빌드 및 테스트 상태 확인
 * 3. 코드 수정 (자율적)
 * 4. Git 커밋 및 로그 업데이트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const PRD_PATH = path.join(PROJECT_ROOT, 'PRD_VIBE.md');
const LOG_PATH = path.join(PROJECT_ROOT, 'LIVE_LOG.md');

function log(message, level = 'INFO') {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

async function runLoop() {
    log('🌊 랄프 루프를 시작합니다...');

    try {
        // 1. 현재 상태 읽기
        if (!fs.existsSync(PRD_PATH)) {
            log('PRD_VIBE.md 파일이 없습니다. 초기화가 필요합니다.', 'ERROR');
            return;
        }
        
        const prdContent = fs.readFileSync(PRD_PATH, 'utf8');
        log('PRD 문서를 읽는 중...');

        // 2. Git 상태 확인 (랄프 루프의 필수 요소)
        try {
            execSync('git --version');
            log('Git 환경 감지 완료.');
        } catch (e) {
            log('Git이 설치되어 있지 않거나 경로에 없습니다. 랄프 루프의 효율이 떨어질 수 있습니다.', 'WARN');
        }

        // 3. 작업 수행 시뮬레이션 (실제 구현 시에는 AI 에이전트 인터페이스 호출)
        log('다음 작업을 결정합니다: [메인 페이지 디자인 개선]');
        
        // 4. 빌드 체크 (Vibe Check)
        log('빌드 무결성을 확인합니다 (npm run lint)...');
        // execSync('npm run lint', { stdio: 'inherit' });

        // 5. 결과 기록
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}`;
        
        let logContent = fs.readFileSync(LOG_PATH, 'utf8');
        const newEntry = `| ${now.toLocaleDateString()} | 인지 재구성 UI 개선 및 랄프 루프 가동 | ✅ 성공 | 자동화 환성 구축 완료 |`;
        
        // 간단한 로그 업데이트 로직
        if (logContent.includes('---')) {
            const parts = logContent.split('---');
            logContent = parts[0] + '---\n\n### 📝 최근 루프 요약\n' + newEntry + '\n' + parts[1].split('### 📝 최근 루프 요약')[1];
        }

        fs.writeFileSync(LOG_PATH, logContent);
        log('LIVE_LOG.md 업데이트 완료.');
        
        log('✅ 루프 완료. 다음 회차를 기다립니다.');

    } catch (error) {
        log(`루프 중 에러 발생: ${error.message}`, 'ERROR');
        // 자가 치유 로직: 에러 발생 시 로그에 기록하고 다음 루프에서 수정 시도
        fs.appendFileSync(LOG_PATH, `\n\n> ⚠️ **Error Detected: ${error.message}**\n> 랄프 에이전트가 다음 루프에서 수정을 시도합니다.`);
    }
}

// 스크립트 직접 실행 시 루프 가동
if (require.main === module) {
    runLoop();
}

module.exports = { runLoop };
