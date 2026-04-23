const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const ENV_PATH = path.join(__dirname, '../.env.local');
const JSONL_PATH = path.join(__dirname, '../samples/finetune_classify.jsonl');

async function runFinetuning() {
    console.log('--- 파인튜닝 프로세스 시작 ---');

    // 1. .env.local에서 API 키 읽기
    if (!fs.existsSync(ENV_PATH)) {
        console.error('.env.local 파일을 찾을 수 없습니다.');
        return;
    }

    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENAI_API_KEY\s*=\s*["']?(.*?)["']?(\s|$)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error('OPENAI_API_KEY를 .env.local에서 찾을 수 없습니다.');
        return;
    }

    const openai = new OpenAI({ apiKey });

    try {
        // 2. 학습 파일 업로드
        console.log('1. 학습 데이터 업로드 중...');
        const file = await openai.files.create({
            file: fs.createReadStream(JSONL_PATH),
            purpose: 'fine-tune',
        });
        console.log(`학습 파일 업로드 완료 (ID: ${file.id})`);

        // 3. 파인튜닝 Job 생성
        console.log('2. 파인튜닝 Job 생성 중 (gpt-4o-mini-2024-07-18)...');
        const job = await openai.fineTuning.jobs.create({
            training_file: file.id,
            model: 'gpt-4o-mini-2024-07-18',
        });
        console.log('--- Job 생성 완료! ---');
        console.log(`Job ID: ${job.id}`);
        console.log(`현재 상태: ${job.status}`);
        console.log('\n주의: 학습 완료까지 약 10~20분 정도 소요됩니다.');
        console.log('학습이 완료되면 OpenAI에서 이메일이 발송되며,');
        console.log('완료된 모델 ID로 .env.local을 업데이트해야 합니다.');

    } catch (error) {
        console.error('파인튜닝 실행 중 오류 발생:', error.message);
    }
}

runFinetuning();
