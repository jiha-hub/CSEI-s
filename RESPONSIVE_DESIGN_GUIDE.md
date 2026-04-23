# MoodB UI/UX 반응형 디자인 지침

> **모든 수정 시 이 지침을 반드시 준수할 것.**  
> 담당자는 매 컴포넌트/페이지 수정마다 아래 체크리스트를 확인하세요.

---

## 📐 반응형 브레이크포인트

| 이름 | 너비 | 적용 대상 |
|------|------|----------|
| `sm` | 640px+ | 모바일(가로), 작은 태블릿 |
| `md` | 768px+ | 태블릿 |
| `lg` | 1024px+ | 데스크톱 |
| `xl` | 1280px+ | 와이드 데스크톱 |

---

## ✅ 반응형 체크리스트 (매 수정마다 반영)

### 레이아웃
- [ ] 모든 grid는 모바일 1열 → 태블릿 2열 → 데스크톱 3~7열 순으로 설정
- [ ] `flex-col` (모바일) → `md:flex-row` (데스크톱) 전환 패턴 사용
- [ ] `max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10` 기본 컨테이너 패턴 준수
- [ ] 고정 너비(px) 사용 금지 → `w-full`, `max-w-*`, `%` 활용

### 타이포그래피
- [ ] 제목: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl` 패턴
- [ ] 본문: `text-sm sm:text-base md:text-lg` 패턴
- [ ] 최소 폰트 크기: 12px (모바일), 14px (데스크톱)
- [ ] 감정 단어/점수: 최소 16px 이상

### 버튼 & 인터랙션
- [ ] 터치 영역: 최소 44×44px (모바일 탭 가능)
- [ ] 버튼: `px-4 py-3 sm:px-6 sm:py-4` 패턴
- [ ] 호버 효과는 `hover:` (데스크톱), 탭 피드백은 `active:scale-95`

### 이미지/차트
- [ ] 차트: `ResponsiveContainer width="100%" height="100%"` 필수
- [ ] 차트 높이: `h-[300px] md:h-[400px] lg:h-[500px]` 패턴
- [ ] 이미지: `w-full object-cover` + `aspect-ratio` 사용

### 네비게이션
- [ ] 모바일: 햄버거 메뉴 (lg:hidden)
- [ ] 데스크톱: 풀 네비게이션 (hidden lg:flex)
- [ ] 하단 고정 요소: 모바일 safe-area 고려 (`pb-safe`)

### 카드 & 그리드
- [ ] 감정 점수 카드: `grid-cols-2 sm:grid-cols-4 md:grid-cols-7`
- [ ] 히스토리 카드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] 패딩: `p-4 sm:p-6 md:p-8` 패턴

---

## 🎨 디자인 토큰

```css
/* 색상 */
--color-sage: #566e63;       /* 주색 */
--color-sand: #bfa588;       /* 보조색 */
--color-paper: #fffdfa;      /* 배경 */

/* 폰트 */
--font-main: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;

/* 사전/사후 색상 */
pre-color: #22c55e;    /* 사전 = 초록 */
post-color: #ef4444;   /* 사후 = 붉은색 */
```

---

## 📱 모바일 우선 원칙

1. **기본 스타일 = 모바일** → `sm:`, `md:`, `lg:` 순으로 확장
2. **터치 친화적 UI**: 버튼 충분히 크게, 간격 넉넉하게
3. **스크롤 중심**: 모바일에서 가로 스크롤 지양
4. **폰트 가독성**: 회색 계열 `text-gray-*` 대신 `text-[#333]`, `text-[#222]` 사용

---

## 🚫 금지 사항

- `fixed` 너비 값으로 레이아웃 깨짐 유발 금지
- `overflow-x-hidden` 없이 가로 스크롤 방치 금지
- 모바일에서 텍스트가 카드 밖으로 넘치는 상황 금지
- `text-[10px]` 미만 폰트 크기 남용 금지
