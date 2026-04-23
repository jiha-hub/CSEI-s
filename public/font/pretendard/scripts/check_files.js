const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const ENV_PATH = path.join(__dirname, '../.env.local');

async function checkFileStatus() {
    console.log('--- 파일 상태 확인 ---');
    if (!fs.existsSync(ENV_PATH)) return;
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENAI_API_KEY\s*=\s*["']?(.*?)["']?(\s|$)/);
    const apiKey = match ? match[1].trim() : null;
    const openai = new OpenAI({ apiKey });

    try {
        const files = await openai.files.list({ purpose: 'fine-tune' });
        console.log(`최근 파일 리스트 (${files.data.length}개):`);
        files.data.slice(0, 3).forEach(f => {
            console.log(`ID: ${f.id}, 이름: ${f.filename}, 상태: ${f.status}, 생성일: ${new Date(f.created_at * 1000).toLocaleString()}`);
        });
    } catch (error) {
        console.error('파일 확인 중 오류:', error.message);
    }
}

checkFileStatus();
