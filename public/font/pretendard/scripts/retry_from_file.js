const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const ENV_PATH = path.join(__dirname, '../.env.local');

async function retryJob() {
    console.log('--- 기존 파일(ID)로 파인튜닝 재시도 ---');
    if (!fs.existsSync(ENV_PATH)) return;
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENAI_API_KEY\s*=\s*["']?(.*?)["']?(\s|$)/);
    const apiKey = match ? match[1].trim() : null;
    const openai = new OpenAI({ apiKey });

    try {
        // 이미 'processed' 상태인 파일 ID 가져오기 (가장 최근 것)
        const files = await openai.files.list({ purpose: 'fine-tune' });
        const processedFile = files.data.find(f => f.status === 'processed');

        if (!processedFile) {
            console.error('사용 가능한 processed 파일이 없습니다.');
            return;
        }

        console.log(`사용할 파일 ID: ${processedFile.id} (상태: ${processedFile.status})`);

        const job = await openai.fineTuning.jobs.create({
            training_file: processedFile.id,
            model: 'gpt-4o-mini-2024-07-18',
        });

        console.log('--- Job 생성 완료! ---');
        console.log(`Job ID: ${job.id}`);
        console.log(`상태: ${job.status}`);

    } catch (error) {
        console.error('재시도 중 오류 발생:', error.message);
    }
}

retryJob();
