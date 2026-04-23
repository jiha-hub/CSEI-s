const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../samples/reframing_dataset.csv');
const OUTPUT_PATH = path.join(__dirname, '../samples/finetune_classify_multi.jsonl');

async function prepareFinetuneData() {
    console.log('--- CSV → JSONL 변환 (다중 레이블) ---');
    
    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV 파일을 찾을 수 없습니다:', CSV_PATH);
        return;
    }

    const csvData = fs.readFileSync(CSV_PATH, 'utf8');

    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const rows = results.data;
            console.log(`총 ${rows.length}개 행을 읽었습니다.`);

            // 멀티라벨 분포 통계
            const labelCounts = {};
            let multiLabelCount = 0;

            const jsonlLines = rows.map(row => {
                const situation = (row.situation || '').trim();
                const thought = (row.thought || '').trim();
                const trapsRaw = (row.thinking_traps_addressed || '').trim();

                if (!thought || !trapsRaw) return null;

                // 모든 라벨을 소문자 + 트림하여 쉼표로 연결
                const traps = trapsRaw
                    .split(',')
                    .map(t => t.trim().toLowerCase())
                    .filter(t => t.length > 0)
                    .join(', ');

                // 통계 수집
                const trapList = traps.split(', ');
                if (trapList.length > 1) multiLabelCount++;
                trapList.forEach(t => {
                    labelCounts[t] = (labelCounts[t] || 0) + 1;
                });

                return JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are an expert cognitive behavioral therapist. Classify ALL cognitive distortions present in the user\'s thought. List them separated by commas. Respond with only the distortion names, nothing else.' },
                        { role: 'user', content: `Situation: ${situation}\nThought: ${thought}` },
                        { role: 'assistant', content: traps }
                    ]
                });
            }).filter(Boolean);

            fs.writeFileSync(OUTPUT_PATH, jsonlLines.join('\n') + '\n', 'utf8');
            console.log(`\n변환 완료! 결과 파일: ${OUTPUT_PATH}`);
            console.log(`총 ${jsonlLines.length}개 학습 데이터 생성됨.`);
            console.log(`다중 레이블 데이터: ${multiLabelCount}개 (${(multiLabelCount/jsonlLines.length*100).toFixed(1)}%)`);
            console.log('\n--- 라벨별 분포 ---');
            Object.entries(labelCounts)
                .sort((a, b) => b[1] - a[1])
                .forEach(([label, count]) => {
                    console.log(`  ${label}: ${count}건`);
                });
        }
    });
}

prepareFinetuneData();
