const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const ENV_PATH = path.join(__dirname, '../.env.local');

async function checkStatus() {
    console.log('--- 파인튜닝 상태 확인 ---');

    if (!fs.existsSync(ENV_PATH)) {
        console.error('.env.local 파일을 찾을 수 없습니다.');
        return;
    }

    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENAI_API_KEY\s*=\s*["']?(.*?)["']?(\s|$)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error('API 키를 찾을 수 없습니다.');
        return;
    }

    const openai = new OpenAI({ apiKey });

    try {
        // 가장 최근의 Job 리스트 가져오기
        const jobs = await openai.fineTuning.jobs.list({ limit: 1 });
        if (jobs.data.length === 0) {
            console.log('진행 중인 파인튜닝 Job이 없습니다.');
            return;
        }

        const job = jobs.data[0];
        console.log(`Job ID: ${job.id}`);
        console.log(`모델: ${job.model}`);
        console.log(`상태: ${job.status}`);
        console.log(`생성일: ${new Date(job.created_at * 1000).toLocaleString()}`);

        if (job.status === 'succeeded') {
            console.log('\n✅ 학습이 성공적으로 완료되었습니다!');
            console.log('------------------------------------------');
            console.log(`파인튜닝된 모델 ID: ${job.fine_tuned_model}`);
            console.log('------------------------------------------');
            console.log('\n위 모델 ID를 .env.local의 OPENAI_FINETUNE_MODEL 항목에 복사해 넣으세요.');
        } else if (job.status === 'failed') {
            console.log('\n❌ 학습에 실패했습니다.');
            console.log(`오류 상세: ${JSON.stringify(job.error)}`);
        } else {
            console.log('\n⏳ 아직 학습이 진행 중입니다. 잠시 후 다시 확인해주세요.');
        }

    } catch (error) {
        console.error('상태 확인 중 오류 발생:', error.message);
    }
}

checkStatus();
