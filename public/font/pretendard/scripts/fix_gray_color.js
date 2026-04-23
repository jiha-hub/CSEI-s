/**
 * text-gray-400 → text-gray-600 일괄 변경 (인코딩 안전)
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
  const content = fs.readFileSync(fullPath, 'utf8');
  const updated = content.replace(/text-gray-400/g, 'text-gray-600');
  const count = (content.match(/text-gray-400/g) || []).length;
  fs.writeFileSync(fullPath, updated, 'utf8');
  console.log(`${file}: ${count}건 교체 완료`);
});
