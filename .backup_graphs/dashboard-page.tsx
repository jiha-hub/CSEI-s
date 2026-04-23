'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isClinician } from '@/utils/clinician'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceArea, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Users, User, FileText, TrendingUp,
  CheckCircle2, AlertCircle, LogOut, ChevronRight,
  Calendar, Stethoscope, ClipboardList, Save, Shield
} from 'lucide-react'

// ─── 더미 환자 데이터 (DB 연동 전 임시) ───────────────────────────────────
const DUMMY_PATIENTS = [
  {
    id: 'p1',
    name: '홍길동',
    diagnosis: '범불안장애 (GAD)',
    age: 30,
    gender: '남',
    doctor: '김정신 원장',
    sessions: 6,
    lastVisit: '2026-03-28',
    userId: null, // 실제 연동 시 Supabase user ID 입력
  },
  {
    id: 'p2',
    name: '김영희',
    diagnosis: '주요우울장애 (MDD)',
    age: 28,
    gender: '여',
    doctor: '이상담 원장',
    sessions: 4,
    lastVisit: '2026-03-25',
    userId: null,
  },
  {
    id: 'p3',
    name: '이수현',
    diagnosis: '적응장애',
    age: 45,
    gender: '여',
    doctor: '박심리 원장',
    sessions: 3,
    lastVisit: '2026-03-20',
    userId: null,
  },
]

// 더미 설문 결과 (T-score 시계열)
const DUMMY_TREND: Record<string, any[]> = {
  p1: [
    { name: '1회차', '희(喜)': 82, '노(怒)': 73, '사(思)': 61, '우(憂)': 43, '비(悲)': 67, '공(恐)': 72, '경(驚)': 78 },
    { name: '2회차', '희(喜)': 75, '노(怒)': 68, '사(思)': 59, '우(憂)': 48, '비(悲)': 70, '공(恐)': 65, '경(驚)': 71 },
    { name: '3회차', '희(喜)': 70, '노(怒)': 62, '사(思)': 55, '우(憂)': 52, '비(悲)': 65, '공(恐)': 61, '경(驚)': 66 },
    { name: '4회차', '희(喜)': 66, '노(怒)': 58, '사(思)': 53, '우(憂)': 55, '비(悲)': 62, '공(恐)': 57, '경(驚)': 62 },
    { name: '5회차', '희(喜)': 63, '노(怒)': 55, '사(思)': 50, '우(憂)': 57, '비(悲)': 59, '공(恐)': 54, '경(驚)': 59 },
    { name: '6회차', '희(喜)': 60, '노(怒)': 52, '사(思)': 49, '우(憂)': 55, '비(悲)': 55, '공(恐)': 51, '경(驚)': 56 },
  ],
  p2: [
    { name: '1회차', '희(喜)': 38, '노(怒)': 55, '사(思)': 72, '우(憂)': 78, '비(悲)': 75, '공(恐)': 63, '경(驚)': 58 },
    { name: '2회차', '희(喜)': 41, '노(怒)': 52, '사(思)': 68, '우(憂)': 74, '비(悲)': 71, '공(恐)': 60, '경(驚)': 55 },
    { name: '3회차', '희(喜)': 45, '노(怒)': 50, '사(思)': 64, '우(憂)': 69, '비(悲)': 68, '공(恐)': 57, '경(驚)': 53 },
    { name: '4회차', '희(喜)': 49, '노(怒)': 48, '사(思)': 61, '우(憂)': 63, '비(悲)': 64, '공(恐)': 54, '경(驚)': 51 },
  ],
  p3: [
    { name: '1회차', '희(喜)': 52, '노(怒)': 65, '사(思)': 71, '우(憂)': 68, '비(悲)': 63, '공(恐)': 55, '경(驚)': 50 },
    { name: '2회차', '희(喜)': 54, '노(怒)': 61, '사(思)': 67, '우(憂)': 63, '비(悲)': 60, '공(恐)': 53, '경(驚)': 49 },
    { name: '3회차', '희(喜)': 56, '노(怒)': 58, '사(思)': 63, '우(憂)': 59, '비(悲)': 57, '공(恐)': 51, '경(驚)': 49 },
  ],
}

// 더미 상담 기록
const DUMMY_SESSIONS: Record<string, any[]> = {
  p1: [
    { id: 's6', seq: 6, date: '2026-03-28', type: 'CSEI-s 진단', summary: '전반적 수치 개선. 공(恐) 지표 주의 → 정상 진입.', memo: '' },
    { id: 's5', seq: 5, date: '2026-03-14', type: '인지재구성', summary: '과도한 일반화, 독심술 패턴 식별. 재구성 3회 수행.', memo: '자기 효능감 조금씩 회복. 다음 회차에 행동 실험 과제 부여 예정.' },
    { id: 's4', seq: 4, date: '2026-03-07', type: 'CSEI-s 진단', summary: '노(怒) 지표 위험→주의 개선. 우(憂) 안정.', memo: '' },
    { id: 's3', seq: 3, date: '2026-02-28', type: '인지재구성', summary: '흑백논리, 점치기 패턴 발견. 균형 잡힌 사고 연습.', memo: '예상보다 빠른 인지적 유연성 증가.' },
    { id: 's2', seq: 2, date: '2026-02-14', type: 'CSEI-s 진단', summary: '전반 수치 소폭 개선. 유지 수준.', memo: '' },
    { id: 's1', seq: 1, date: '2026-02-07', type: 'CSEI-s 진단', summary: '초기 평가. 노(怒) 73, 공(恐) 72 주의 수준.', memo: '초기 신뢰 관계 형성에 집중. 일지 작성 권고.' },
  ],
  p2: [
    { id: 's4', seq: 4, date: '2026-03-25', type: 'CSEI-s 진단', summary: '우(憂) 63으로 하락. 희(喜) 49 주의 진입.', memo: '' },
    { id: 's3', seq: 3, date: '2026-03-11', type: '인지재구성', summary: '내탓하기, 감정적 추론 패턴 반복 확인.', memo: '자기 비판적 사고 빈도 증가. 행동 활성화 계획 수립.' },
    { id: 's2', seq: 2, date: '2026-02-25', type: 'CSEI-s 진단', summary: '초기 대비 우(憂) 소폭 감소.', memo: '' },
    { id: 's1', seq: 1, date: '2026-02-11', type: 'CSEI-s 진단', summary: '초기 평가. 우(憂) 78, 비(悲) 75 위험 수준.', memo: '약물치료 병행 중. 인지 개입 동시 진행.' },
  ],
  p3: [
    { id: 's3', seq: 3, date: '2026-03-20', type: 'CSEI-s 진단', summary: '전반적 소폭 개선. 사(思) 63으로 감소.', memo: '' },
    { id: 's2', seq: 2, date: '2026-03-06', type: '인지재구성', summary: '당위적 사고, 개인화 패턴 인식.', memo: '직장 내 스트레스 요인 구체화. 경계 설정 교육 필요.' },
    { id: 's1', seq: 1, date: '2026-02-20', type: 'CSEI-s 진단', summary: '초기 평가. 사(思) 71, 노(怒) 65 주의 수준.', memo: '적응 스트레스 주 원인: 이직 후 환경 변화.' },
  ],
}

// ─── T-score 재사용 유틸 ───────────────────────────────────────────────────
const INDICATORS = ['희(喜)', '노(怒)', '사(思)', '우(憂)', '비(悲)', '공(恐)', '경(驚)']
const LINE_COLORS = ['#8884d8', '#ff8042', '#ffbb28', '#82ca9d', '#0088fe', '#b0b5bd', '#9b59b6']

function classifyTScore(t: number): 'normal' | 'caution' | 'risk' {
  if (t < 30 || t > 70) return 'risk'
  if ((t >= 30 && t <= 40) || (t >= 60 && t <= 70)) return 'caution'
  return 'normal'
}

const GROUP_COLOR = { normal: '#22c55e', caution: '#f59e0b', risk: '#ef4444' }
const GROUP_LABEL = { normal: '정상', caution: '주의', risk: '위험' }
const GROUP_BG    = { normal: 'bg-green-50 text-green-700 border-green-100', caution: 'bg-amber-50 text-amber-700 border-amber-100', risk: 'bg-red-50 text-red-600 border-red-100' }

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [clinicianEmail, setClinicianEmail] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('p1')
  const [memos, setMemos] = useState<Record<string, string>>({})
  const [savedMemos, setSavedMemos] = useState<Record<string, boolean>>({})
  const [hiddenLines, setHiddenLines] = useState<string[]>([])

  // ── 접근 제어 ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      if (!isClinician(user.email)) {
        router.replace('/')
        return
      }

      setClinicianEmail(user.email ?? '')
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── 선택된 환자 데이터 ─────────────────────────────────────────────────
  const patient = DUMMY_PATIENTS.find(p => p.id === selectedPatientId)!
  const trendData = DUMMY_TREND[selectedPatientId] || []
  const sessions = DUMMY_SESSIONS[selectedPatientId] || []

  // 최신 회차의 T-score 분류
  const latestTrend = trendData[trendData.length - 1] || {}
  const indicatorStatuses = INDICATORS.map(name => ({
    name,
    score: latestTrend[name] ?? 50,
    group: classifyTScore(latestTrend[name] ?? 50),
  }))
  const riskCount    = indicatorStatuses.filter(i => i.group === 'risk').length
  const cautionCount = indicatorStatuses.filter(i => i.group === 'caution').length
  const normalCount  = indicatorStatuses.filter(i => i.group === 'normal').length
  const donutData = [
    { name: '정상', value: normalCount,  color: GROUP_COLOR.normal  },
    { name: '주의', value: cautionCount, color: GROUP_COLOR.caution },
    { name: '위험', value: riskCount,    color: GROUP_COLOR.risk    },
  ].filter(d => d.value > 0)

  const overallWorst = riskCount > 0 ? 'risk' : cautionCount > 0 ? 'caution' : 'normal'

  // ── 메모 관련 ──────────────────────────────────────────────────────────
  const handleMemoChange = (sessionId: string, value: string) => {
    setMemos(prev => ({ ...prev, [sessionId]: value }))
    setSavedMemos(prev => ({ ...prev, [sessionId]: false }))
  }

  const handleMemoSave = (sessionId: string) => {
    // TODO: Supabase 연동 시 여기에 upsert 로직 추가
    console.log('메모 저장 (더미):', sessionId, memos[sessionId])
    setSavedMemos(prev => ({ ...prev, [sessionId]: true }))
    setTimeout(() => setSavedMemos(prev => ({ ...prev, [sessionId]: false })), 2000)
  }

  const handleLineLegendClick = (e: any) => {
    const key = e.dataKey
    setHiddenLines(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  // ── 로딩/권한 체크 중 ─────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#566e63] border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-gray-500">권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // ── 렌더링 ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f2f1] font-sans text-[#222]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="bg-[#2d3e35] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#566e63] rounded-lg flex items-center justify-center">
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight">임상 대시보드</div>
            <div className="text-[10px] text-white/50 font-medium">Clinical Dashboard · Beta</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
            <Shield size={12} className="text-green-400" />
            <span className="text-[11px] font-bold text-white/80">{clinicianEmail}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-[11px] font-bold"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-61px)]">

        {/* ── 환자 목록 사이드바 ──────────────────────────────────────── */}
        <aside className="w-64 bg-[#2d3e35] text-white flex flex-col shrink-0 overflow-y-auto">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-white/50" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">환자 목록</span>
            </div>
            <div className="text-xs text-white/30 font-medium">총 {DUMMY_PATIENTS.length}명</div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {DUMMY_PATIENTS.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPatientId(p.id); setHiddenLines([]) }}
                className={`w-full text-left px-4 py-3.5 rounded-xl transition-all group ${
                  selectedPatientId === p.id
                    ? 'bg-[#566e63] shadow-lg'
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                      selectedPatientId === p.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">{p.name}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{p.diagnosis}</div>
                    </div>
                  </div>
                  {selectedPatientId === p.id && <ChevronRight size={14} className="text-white/50" />}
                </div>
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="text-[10px] text-white/20 text-center font-medium">
              ※ DB 연동 전 더미 데이터
            </div>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1100px] mx-auto space-y-6">

            {/* ── ① 환자 기본 정보 카드 ─────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#e8efe9] rounded-2xl flex items-center justify-center">
                    <User size={28} className="text-[#566e63]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-extrabold tracking-tight">{patient.name}</h1>
                      <span className="bg-[#e8efe9] text-[#4a5c53] text-[11px] font-bold px-3 py-1 rounded-full">
                        {patient.diagnosis}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-gray-500 font-medium">
                      <span>{patient.age}세 · {patient.gender}</span>
                      <span className="text-gray-300">|</span>
                      <span>담당: <strong className="text-[#4a5c53]">{patient.doctor}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  {[
                    { icon: <ClipboardList size={16} />, label: '총 회차', value: `${patient.sessions}회` },
                    { icon: <Calendar size={16} />, label: '최근 방문', value: patient.lastVisit },
                    {
                      icon: <AlertCircle size={16} />,
                      label: '현재 상태',
                      value: GROUP_LABEL[overallWorst],
                      color: overallWorst === 'risk' ? 'text-red-500' : overallWorst === 'caution' ? 'text-amber-500' : 'text-green-600'
                    },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#f8f9fa] rounded-xl px-4 py-3 text-center min-w-[90px]">
                      <div className="flex justify-center text-gray-400 mb-1">{item.icon}</div>
                      <div className={`font-extrabold text-[15px] ${(item as any).color || 'text-[#2d3e35]'}`}>{item.value}</div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ② T-score 분류 + ③ 변화 그래프 ───────────────────── */}
            <div className="grid md:grid-cols-[340px_1fr] gap-6">

              {/* ② T-score 분류 현황 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
                <h2 className="font-bold text-[14px] text-[#2d3e35] mb-5 flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#566e63]" />
                  T-score 분류 현황
                </h2>

                {/* 도넛 차트 */}
                <div className="flex justify-center mb-5 relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-extrabold ${
                      overallWorst === 'risk' ? 'text-red-500' : overallWorst === 'caution' ? 'text-amber-500' : 'text-green-600'
                    }`}>{GROUP_LABEL[overallWorst]}</span>
                    <span className="text-[10px] text-gray-400 font-medium">종합 판정</span>
                  </div>
                </div>

                {/* 범례 */}
                <div className="flex justify-center gap-4 mb-5">
                  {[
                    { label: '정상', count: normalCount,  color: 'bg-green-400' },
                    { label: '주의', count: cautionCount, color: 'bg-amber-400' },
                    { label: '위험', count: riskCount,    color: 'bg-red-400'   },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-[11px] font-bold text-gray-600">{item.label} {item.count}</span>
                    </div>
                  ))}
                </div>

                {/* 지표별 배지 */}
                <div className="space-y-2">
                  {indicatorStatuses.map(ind => (
                    <div key={ind.name} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${GROUP_BG[ind.group]}`}>
                      <span className="font-bold text-[12px]">{ind.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[13px]">{ind.score}</span>
                        <span className="text-[10px] font-bold border rounded-full px-2 py-0.5 border-current">
                          {GROUP_LABEL[ind.group]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ③ 설문 변화 그래프 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
                <h2 className="font-bold text-[14px] text-[#2d3e35] mb-5 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#566e63]" />
                  설문 결과 변화 추이
                </h2>
                <div className="w-full h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f4" />
                      <ReferenceArea y1={40} y2={60} fill="#22c55e" fillOpacity={0.06}
                        label={{ position: 'insideRight', value: '정상', fill: '#16a34a', fontSize: 9, fontWeight: 'bold' }} />
                      <ReferenceArea y1={60} y2={70} fill="#f59e0b" fillOpacity={0.08}
                        label={{ position: 'insideRight', value: '주의', fill: '#d97706', fontSize: 9, fontWeight: 'bold' }} />
                      <ReferenceArea y1={30} y2={40} fill="#f59e0b" fillOpacity={0.08} />
                      <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.06}
                        label={{ position: 'insideRight', value: '위험', fill: '#dc2626', fontSize: 9, fontWeight: 'bold' }} />
                      <ReferenceArea y1={0} y2={30} fill="#ef4444" fillOpacity={0.06} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#bbb' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [
                          `${value} (${GROUP_LABEL[classifyTScore(value)]})`, name
                        ]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        onClick={handleLineLegendClick}
                        wrapperStyle={{ paddingTop: '32px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      {INDICATORS.map((ind, i) => (
                        <Line
                          key={ind}
                          type="monotone"
                          name={ind}
                          dataKey={ind}
                          hide={hiddenLines.includes(ind)}
                          stroke={LINE_COLORS[i]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-gray-400 font-medium text-center mt-2">
                  범례를 클릭하면 지표를 켜고 끌 수 있습니다.
                </p>
              </div>
            </div>

            {/* ── ④ 회차별 상담 기록 타임라인 ─────────────────────── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
              <h2 className="font-bold text-[14px] text-[#2d3e35] mb-6 flex items-center gap-2">
                <FileText size={16} className="text-[#566e63]" />
                회차별 상담 기록
              </h2>

              <div className="space-y-4">
                {sessions.map((session) => {
                  const memo = memos[session.id] ?? session.memo
                  const isSaved = savedMemos[session.id]
                  return (
                    <div key={session.id} className="border border-gray-100 rounded-2xl p-5 hover:border-[#566e63]/20 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">

                        {/* 회차 배지 + 날짜 */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 bg-[#2d3e35] text-white rounded-xl flex items-center justify-center font-extrabold text-[13px]">
                            {session.seq}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-gray-400">{session.date}</div>
                            <div className={`text-[11px] font-bold mt-0.5 ${
                              session.type === 'CSEI-s 진단' ? 'text-[#566e63]' : 'text-amber-600'
                            }`}>{session.type}</div>
                          </div>
                        </div>

                        {/* 내용 요약 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{session.summary}</p>

                          {/* 담당의 메모 입력 */}
                          <div className="bg-[#f8f9fa] rounded-xl p-3">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Stethoscope size={10} />
                              담당의 메모
                            </div>
                            <textarea
                              value={memo}
                              onChange={(e) => handleMemoChange(session.id, e.target.value)}
                              placeholder="이 회차에 대한 임상 메모를 입력하세요..."
                              rows={2}
                              className="w-full bg-white text-[12px] text-gray-700 placeholder-gray-300 resize-none outline-none rounded-lg p-2.5 border border-gray-100 focus:border-[#566e63]/30 focus:ring-2 focus:ring-[#566e63]/5 transition-all leading-relaxed"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleMemoSave(session.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                  isSaved
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-[#2d3e35] text-white hover:bg-[#566e63] active:scale-95'
                                }`}
                              >
                                {isSaved ? <><CheckCircle2 size={12} /> 저장됨</> : <><Save size={12} /> 메모 저장</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
