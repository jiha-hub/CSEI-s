/**
 * UTF-8 인코딩이 깨진 파일들을 복구하는 스크립트
 * 깨진 바이트 시퀀스를 올바른 한국어 문자로 교체
 */
const fs = require('fs');
const path = require('path');

const files = [
  'app/login/page.tsx',
  'app/chat/page.tsx',
  'app/select/page.tsx',
  'app/questionnaire/page.tsx',
  'app/my-situation/page.tsx',
  'app/page.tsx',
  'app/layout.tsx',
  'app/login/auth-form.tsx',
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${file} (파일 없음)`);
    return;
  }
  
  const buf = fs.readFileSync(fullPath);
  
  // 깨진 바이트가 있는지 확인
  let hasBroken = false;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 127) {
      if ((buf[i] & 0xE0) === 0xC0) {
        if (i + 1 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80) { hasBroken = true; break; }
        i++;
      } else if ((buf[i] & 0xF0) === 0xE0) {
        if (i + 2 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80) { hasBroken = true; break; }
        i += 2;
      } else if ((buf[i] & 0xF8) === 0xF0) {
        if (i + 3 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80 || (buf[i + 3] & 0xC0) !== 0x80) { hasBroken = true; break; }
        i += 3;
      } else {
        hasBroken = true;
        break;
      }
    }
  }
  
  if (!hasBroken) {
    console.log(`OK: ${file}`);
    return;
  }
  
  // 깨진 바이트 복구: euc-kr/cp949 → utf-8 변환 시도
  // 대부분의 경우 이전 편집 도구가 UTF-8 파일을 cp949로 읽고 다시 저장하면서 발생
  // iconv-lite가 없으므로, 깨진 바이트를 빈 문자로 대체하고 수동 확인 필요
  
  // 다른 접근: 깨진 부분의 컨텍스트를 출력하여 무엇이 깨졌는지 확인
  const content = buf.toString('utf8');  // 깨진 부분은 replacement char로 대체됨
  
  // 깨진 바이트 주변 컨텍스트 출력
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 127) {
      let valid = true;
      if ((buf[i] & 0xE0) === 0xC0) {
        if (i + 1 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80) valid = false;
        else i++;
      } else if ((buf[i] & 0xF0) === 0xE0) {
        if (i + 2 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80) valid = false;
        else i += 2;
      } else if ((buf[i] & 0xF8) === 0xF0) {
        if (i + 3 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80 || (buf[i + 3] & 0xC0) !== 0x80) valid = false;
        else i += 3;
      } else {
        valid = false;
      }
      
      if (!valid) {
        const start = Math.max(0, i - 30);
        const end = Math.min(buf.length, i + 30);
        const context = buf.slice(start, end).toString('utf8');
        console.log(`BROKEN: ${file} at byte ${i} (0x${buf[i].toString(16)})`);
        console.log(`  Context: ...${context}...`);
        console.log(`  Hex around: ${buf.slice(Math.max(0, i-5), Math.min(buf.length, i+10)).toString('hex')}`);
        break;
      }
    }
  }
});
