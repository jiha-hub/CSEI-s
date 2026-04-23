'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceArea
} from 'recharts'
import { Sparkles, Moon, Smile, Meh, Frown, Search, Filter, ArrowRight, AlertCircle, LogOut, TrendingUp, LayoutGrid, Calendar, User, Bell, Settings, Activity, BrainCircuit, HeartPulse, ChevronRight, CheckCircle2 } from 'lucide-react'

interface EmotionScore {
  subject: string
  A: number
  fullMark: number
  group: 'normal' | 'caution' | 'risk'
  groupLabel: string
  rawScore: number
}

interface ResultData {
  id?: string
  timestamp: string
  gender: string
  ageGroup: string
  scores: EmotionScore[]
  overallTScore: number
  overallGroup: 'normal' | 'caution' | 'risk'
}

const GROUP_COLOR: Record<string, string> = {
  normal: 'bg-green-50 text-green-700 border-green-200',
  caution: 'bg-amber-50 text-amber-700 border-amber-200',
  risk: 'bg-red-50 text-red-700 border-red-200',
}

const GROUP_TEXT_COLOR: Record<string, string> = {
  normal: 'text-green-600',
  caution: 'text-amber-500',
  risk: 'text-red-500',
}

const LINE_COLORS: Record<string, string> = {
  normal: '#22c55e',
  caution: '#f59e0b',
  risk: '#ef4444',
}

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idQuery = searchParams.get('id')
  
  const [result, setResult] = useState<ResultData | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [allResults, setAllResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('final_csei_results')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.length > 0) {
          let foundRecord: ResultData | undefined;
          const resultsArray: ResultData[] = Array.isArray(parsed) ? parsed : [parsed];
          
          if (resultsArray.length > 0) {
            if (idQuery) {
              foundRecord = resultsArray.find((r: any) => 
                (r.id === idQuery || `csei-${r.id}` === idQuery || r.timestamp === idQuery)
              )
            }
            
            // 파라미터로 못 찾았거나 idQuery가 없으면 가장 최근 것 사용
            if (!foundRecord) {
              foundRecord = resultsArray[0]
            }
          }
          
          setAllResults(resultsArray)
          
          if (foundRecord) {
            setResultId(foundRecord.id ? `csei-${foundRecord.id}` : foundRecord.timestamp)
            setResult(foundRecord)
          }
        }
      } catch (e) {
        console.error('결과 데이터를 파싱하는 중 오류가 발생했습니다.', e)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin w-10 h-10 border-4 border-[#566e63] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!result || !result.scores) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfdfc] text-center px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">분석 결과를 찾을 수 없습니다</h2>
        <p className="text-gray-500 mb-8">설문을 먼저 완료해 주세요.</p>
        <Link href="/questionnaire" className="bg-[#566e63] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#4a5c53] transition-colors">
          설문하러 가기
        </Link>
      </div>
    )
  }

  const { scores } = result
  const attentionRequired = scores.filter(s => s.group !== 'normal')

  // 감정별 맞춤형 코멘트 
  const getEmotionComment = (score: EmotionScore) => {
    if (score.group === 'risk') return `'${score.subject}' 감정이 위험 수준입니다. 각별한 관리와 주의가 필요합니다.`
    if (score.group === 'caution') return `'${score.subject}' 감정이 다소 불안정합니다. 편안한 휴식이 도움이 될 수 있습니다.`
    return `'${score.subject}' 측면에서 안정적입니다.`
  }

  // 중단 우측 요약 텍스트
  const getOverallSummary = () => {
    if (attentionRequired.length > 0) {
      const mainEmotion = attentionRequired.reduce((prev, current) => 
        (current.group === 'risk' ? current : prev), attentionRequired[0])
      return `현재 돌봄이 필요한 감정들이 감지되었습니다. 특히 ${mainEmotion.subject} 지표가 ${mainEmotion.groupLabel} 상태입니다. 이 부분을 중심으로 전문적인 접근 방향을 모색해보는 것이 좋습니다.`
    }
    return '현재 전체적인 감정 상태가 모두 정상 범위에 있으며 매우 평온합니다. 지금의 안정을 유지하기 위한 가벼운 마음챙김 명상이나 일상 속 관리를 계속해 주세요.'
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-[#333] pb-24">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="px-6 md:px-10 py-6 flex justify-between items-center max-w-[1400px] mx-auto border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="font-extrabold text-xl tracking-tight text-[#4a5c53] flex items-center gap-2">
          <BrainCircuit size={24} />
          파이널 서비스
        </Link>
        <nav className="hidden md:flex gap-10 font-bold text-[11px] text-gray-500 uppercase tracking-widest">
          <Link href="/" className="hover:text-black transition-colors">홈</Link>
          <Link href="/select" className="hover:text-black transition-colors">인지재구성(Cure)</Link>
          <Link href="/my-situation" className="hover:text-black transition-colors">마이페이지</Link>
          <Link href="/chat" className="hover:text-black transition-colors">상담 챗봇</Link>
        </nav>
        <Link href="/my-situation" className="text-sm font-bold text-[#566e63] hover:text-black flex items-center gap-1 transition-colors">
          전체 기록 <ChevronRight size={16} />
        </Link>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 pt-10">
        
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="text-[10px] font-bold text-[#566e63] tracking-[0.2em] uppercase mb-4 block">
            RESULT SUMMARY
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#222]">
            나의 감정 진단 요약
          </h1>
        </div>

        {/* ── 섹션 ①: 7가지 감정 점수 요약 트랙 (반응형 1줄 배치) ────────── */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
          <div className="grid grid-cols-7 gap-1.5 md:gap-3">
            {scores.map((score, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border ${GROUP_COLOR[score.group]} transition-all`}
              >
                <span className="text-[10px] sm:text-xs font-bold tracking-widest text-current/60 mb-1 sm:mb-2 truncate max-w-full">
                  {score.subject.replace(/[^가-힣]/g, '')} {/* 한자 제외 한글만 */}
                </span>
                <span className="text-base sm:text-2xl font-extrabold mb-1">{score.A}</span>
                <div className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-white/60 ${GROUP_TEXT_COLOR[score.group]} whitespace-nowrap`}>
                  {score.groupLabel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 섹션 ② & ③: 시각화 차트 및 핵심 진단 리포트 (좌우 분할) ────── */}
        <div className="grid md:grid-cols-5 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          
          {/* 차트 영역 (좌측 3열) */}
          <div className="md:col-span-3 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
              <Activity size={18} /> 감정 지수 프로파일 (Line Chart)
            </h3>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scores} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f4" />
                  
                  {/* T-Score 배경 영역 판별 */}
                  <ReferenceArea y1={40} y2={60} fill="#22c55e" fillOpacity={0.05} />
                  <ReferenceArea y1={60} y2={70} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={30} y2={40} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.05} />
                  <ReferenceArea y1={0} y2={30} fill="#ef4444" fillOpacity={0.05} />

                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: '#666', fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#999' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                    formatter={(val: any, name: any, props: any) => [
                      val, 
                      props.payload.groupLabel
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="A" 
                    stroke="#566e63" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#566e63', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 리포트 정리 영역 (우측 2열) */}
          <div className="md:col-span-2 bg-[#f9faf9] p-8 md:p-10 rounded-[32px] flex flex-col justify-between">
            <div>
               <h3 className="text-xl font-extrabold mb-6 text-[#222] tracking-tight">현 상태 요약</h3>
               <p className="text-[#555] font-medium leading-relaxed mb-6 text-[15px]">
                 {getOverallSummary()}
               </p>
               <div className="space-y-3">
                 {attentionRequired.map((score, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <AlertCircle size={16} className={`mt-0.5 ${GROUP_TEXT_COLOR[score.group]} shrink-0`} />
                      <p className="text-xs text-gray-600 font-bold leading-normal">{getEmotionComment(score)}</p>
                    </div>
                 ))}
                 {attentionRequired.length === 0 && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500 shrink-0" />
                      <p className="text-xs text-gray-600 font-bold leading-normal">모든 감정 영역이 통제 범위 내에 있습니다.</p>
                    </div>
                 )}
               </div>
            </div>
            
            <Link href={`/report?id=${resultId}`} className="mt-8 bg-white border border-gray-200 text-[#4a5c53] font-bold py-3 px-8 rounded-full inline-flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm self-start group">
              <BrainCircuit size={16} className="group-hover:text-[#566e63]" />
              의학적 심층 리포트 보기
              <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── 섹션 ④: 치료 연계 (Action Section) ─────────────────────── */}
        <div className="mb-20 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-300">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight text-[#222]">
              어떤 감정을 먼저 다룰까요?
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              방금 검사에서 집중 관리가 필요하다고 판정된 감정들입니다. 심리 치료를 선택하고 마음의 짐을 가볍게 내려놓으세요.
            </p>
          </div>

          {attentionRequired.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {attentionRequired.map((score, idx) => (
                <Link 
                  href={`/meditation/${encodeURIComponent(score.subject)}`} 
                  key={idx}
                  className="w-full sm:w-[280px] bg-white border-2 border-[#eaeced] hover:border-[#566e63] rounded-[24px] p-8 text-center group hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl mb-4 ${GROUP_COLOR[score.group]}`}>
                    {score.subject.replace(/[^가-힣]/g, '')[0]}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#222] mb-2">{score.subject}</h3>
                  <div className={`text-xs font-bold mb-6 ${GROUP_TEXT_COLOR[score.group]}`}>{score.groupLabel} 상태</div>
                  
                  <div className="w-full py-3 bg-[#f9faf9] group-hover:bg-[#566e63] group-hover:text-white rounded-xl font-bold text-sm text-gray-500 transition-colors flex items-center justify-center gap-2">
                    치유 시작하기 <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-[#f0f9f3] border border-[#d1e8da] rounded-[32px] p-10 md:p-14 text-center max-w-3xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-[#e3f4ea] rounded-full flex items-center justify-center mb-6">
                <Smile size={32} className="text-[#2fa65a]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#222] mb-4">
                현재는 치유가 <span className="text-[#2fa65a]">가장 급한 감정</span>이 없어요
              </h3>
              <p className="text-gray-600 font-medium mb-8 max-w-md leading-relaxed">
                모든 감정 지표가 안정권입니다. 치유를 서두르기보다 오늘의 평안함을 유지하기 위한 가벼운 마음챙김 명상이나 산책을 추천합니다.
              </p>
              <Link href="/select" className="inline-flex items-center gap-2 bg-[#2fa65a] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[#258748] transition-colors">
                <HeartPulse size={18} /> 추천 프로그램 둘러보기
              </Link>
            </div>
          )}
        </div>

        {/* ── 섹션 ⑤: 이전 기록 선택 (나의 진단 히스토리) ──────────────── */}
        {allResults.length > 1 && (
          <div className="mb-20 pt-10 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-500">
            <h3 className="text-xl font-extrabold text-[#222] mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#566e63]" />
              나의 이전 진단 목록
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allResults.map((rec, idx) => {
                const recId = rec.id ? `csei-${rec.id}` : rec.timestamp;
                const isCurrent = recId === resultId;
                const d = new Date(rec.timestamp);
                const displayDate = d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <Link 
                    key={idx} 
                    href={isCurrent ? '#' : `/result?id=${recId}`}
                    className={`
                      flex flex-col p-4 rounded-2xl border transition-all text-left
                      ${isCurrent 
                        ? 'bg-[#566e63] border-[#566e63] text-white shadow-md' 
                        : 'bg-white border-gray-200 hover:border-[#566e63] hover:shadow-sm group text-[#333] cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold tracking-widest ${isCurrent ? 'text-white/80' : 'text-gray-400'}`}>
                        {displayDate}
                      </span>
                      {isCurrent && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div className={`font-extrabold text-sm mb-1 ${isCurrent ? 'text-white' : 'text-[#222]'}`}>
                      {rec.overallGroup === 'risk' ? '위험' : rec.overallGroup === 'caution' ? '주의' : '안정'} 단계
                    </div>
                    <div className={`text-xs font-medium ${isCurrent ? 'text-white/80' : 'text-gray-500 line-clamp-1 group-hover:text-[#566e63]'}`}>
                      T점수: {Math.round(rec.overallTScore)}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]"><div className="animate-spin w-10 h-10 border-4 border-[#566e63] border-t-transparent rounded-full" /></div>}>
      <ResultContent />
    </Suspense>
  )
}
