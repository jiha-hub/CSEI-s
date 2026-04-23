const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const ENV_PATH = path.join(__dirname, '../.env.local');

async function checkEvents() {
    console.log('--- 파인튜닝 이벤트 로그 확인 ---');

    if (!fs.existsSync(ENV_PATH)) return;
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    const match = envContent.match(/OPENAI_API_KEY\s*=\s*["']?(.*?)["']?(\s|$)/);
    const apiKey = match ? match[1].trim() : null;

    const openai = new OpenAI({ apiKey });

    try {
        const jobs = await openai.fineTuning.jobs.list({ limit: 1 });
        if (jobs.data.length === 0) return;
        const job = jobs.data[0];

        const events = await openai.fineTuning.jobs.listEvents(job.id, { limit: 10 });
        events.data.forEach(event => {
            console.log(`[${new Date(event.created_at * 1000).toLocaleString()}] ${event.level}: ${event.message}`);
        });

    } catch (error) {
        console.error('이벤트 확인 중 오류:', error.message);
    }
}

checkEvents();
