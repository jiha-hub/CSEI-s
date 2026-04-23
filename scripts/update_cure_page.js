/**
 * cure/page.tsx 종합 업데이트 스크립트 (인코딩 안전)
 * 1. text-gray-400 → text-gray-600 (가독성)
 * 2. thinkingTrap → detectedTraps (다중 레이블)
 * 3. 사고함정 UI를 다중 표시 + 설명 출력으로 교체
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/cure/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// ========== 0. text-gray-400 → text-gray-600 ==========
const grayCount = (content.match(/text-gray-400/g) || []).length;
content = content.replace(/text-gray-400/g, 'text-gray-600');
console.log(`0. text-gray-400 → 600: ${grayCount}건 교체`);

// ========== 1. ThinkingTrapItem 인터페이스 추가 ==========
const ifaceMatch = content.match(/interface SimilarCase \{[^}]+\}/);
if (ifaceMatch) {
  content = content.replace(
    ifaceMatch[0],
    ifaceMatch[0] + `\n\ninterface ThinkingTrapItem {\n  name: string\n  description: string\n}`
  );
  console.log('1. ThinkingTrapItem 인터페이스 추가 완료');
} else {
  console.log('1. WARN: SimilarCase 인터페이스를 찾을 수 없음');
}

// ========== 2. 상태 변수 교체 ==========
if (content.includes("const [thinkingTrap, setThinkingTrap] = useState('')")) {
  content = content.replace(
    "const [thinkingTrap, setThinkingTrap] = useState('')",
    "const [detectedTraps, setDetectedTraps] = useState<ThinkingTrapItem[]>([])"
  );
  console.log('2. thinkingTrap → detectedTraps 상태 교체 완료');
} else {
  console.log('2. WARN: thinkingTrap 상태를 찾을 수 없음');
}

// ========== 3. handleAnalyze 내 API 결과 처리 교체 ==========
const analyzePattern = /const detectedTrap = classifyData\.thinking_trap \|\| ''\s*\n\s*setThinkingTrap\(detectedTrap\)/;
if (analyzePattern.test(content)) {
  content = content.replace(
    analyzePattern,
    `const traps = classifyData.thinking_traps || []\n      setDetectedTraps(traps)`
  );
  console.log('3. API 결과 처리 로직 교체 완료');
} else {
  console.log('3. WARN: API 결과 처리 패턴을 찾을 수 없음');
}

// ========== 4. handleSave 내 thinkingTrap 참조 교체 ==========
if (content.includes('thinkingTrap,\n')) {
  content = content.replace(
    /thinkingTrap,\s*\n(\s*)sentiment/,
    "thinkingTrap: detectedTraps.map(t => t.name).join(', '),\n$1sentiment"
  );
  console.log('4. handleSave 내 thinkingTrap 참조 교체 완료');
} else {
  console.log('4. WARN: handleSave 내 thinkingTrap 참조를 찾을 수 없음');
}

// ========== 5. 초기화 로직 교체 ==========
if (content.includes("setThinkingTrap('')")) {
  content = content.replace(
    "setThinkingTrap('')",
    "setDetectedTraps([])"
  );
  console.log('5. 초기화 로직 교체 완료');
} else {
  console.log('5. WARN: setThinkingTrap 초기화를 찾을 수 없음');
}

// ========== 6. UI 렌더링 교체 ==========
const oldUIStart = '{thinkingTrap && (';
const startIdx = content.indexOf(oldUIStart);

if (startIdx !== -1) {
  // 매칭되는 닫는 괄호를 찾기
  let depth = 0;
  let endIdx = startIdx;
  let foundStart = false;
  
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '(' && !foundStart) {
      // 첫 번째 ( 에서 시작
      const prefix = content.substring(startIdx, i + 1);
      if (prefix.includes('&&')) {
        depth = 1;
        foundStart = true;
        continue;
      }
    }
    if (foundStart) {
      if (content[i] === '(') depth++;
      if (content[i] === ')') depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const oldUI = content.substring(startIdx, endIdx);
  
  const newUI = `{detectedTraps.length > 0 && (
              <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100 mb-8 animate-in fade-in slide-in-from-bottom-3">
                <div className="flex items-center gap-2 mb-4 text-amber-900 font-bold">
                  <Zap size={20} className="text-amber-500" />
                  <span>감지된 사고의 함정</span>
                </div>
                <div className="space-y-3">
                  {detectedTraps.map((trap, idx) => (
                    <div key={idx} className="bg-white/80 p-4 rounded-xl shadow-sm border border-amber-100/50">
                      <div className="text-amber-900 font-bold text-[15px] mb-1">{trap.name}</div>
                      {trap.description && (
                        <div className="text-gray-600 text-sm leading-relaxed">{trap.description}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[13px] text-amber-800/70 text-center font-medium">
                  위와 같은 생각의 습관이 당신의 마음을 더 힘들게 하고 있을 수 있어요.
                </p>
              </div>
            )}`;
  
  content = content.substring(0, startIdx) + newUI + content.substring(endIdx);
  console.log('6. UI 렌더링 교체 완료');
} else {
  console.log('6. WARN: thinkingTrap UI 블록을 찾을 수 없음');
}

// ========== 저장 ==========
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ cure/page.tsx 종합 업데이트 완료!');
