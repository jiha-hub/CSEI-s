'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea
} from 'recharts'
import { Sparkles, Moon, Smile, Meh, Frown, Search, Filter, ArrowRight, AlertCircle, LogOut, TrendingUp, LayoutGrid, Calendar, User, Bell, Settings, Activity, Brain, Heart, Fingerprint, Wind } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface RadarItem {
  subject: string
  A: number
  fullMark: number
}

interface HistoryLog {
  id: string | number
  date: string
  type: string
  summary: string
  tags: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  isAssessment?: boolean
}

const DEFAULT_RADAR: RadarItem[] = [
  { subject: '희 (喜)', A: 84, fullMark: 100 },
  { subject: '노 (怒)', A: 75, fullMark: 100 },
  { subject: '사 (思)', A: 62, fullMark: 100 },
  { subject: '우 (憂)', A: 41, fullMark: 100 },
  { subject: '비 (悲)', A: 70, fullMark: 100 },
  { subject: '공 (恐)', A: 65, fullMark: 100 },
  { subject: '경 (驚)', A: 80, fullMark: 100 },
]

export default function MySituationPage() {
  const [radar, setRadar] = useState<RadarItem[]>(DEFAULT_RADAR)
  const [history, setHistory] = useState<HistoryLog[]>([])
  const [allCsei, setAllCsei] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'radar' | 'line'>('radar')
  const [isGuest, setIsGuest] = useState(true)
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsGuest(false)
        const localCsei = localStorage.getItem('final_csei_results')
        const localCure = localStorage.getItem('final_cure_history')
        if (localCsei || localCure) {
          try {
            const res = await fetch('/api/user/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                csei_results: localCsei ? (Array.isArray(JSON.parse(localCsei)) ? JSON.parse(localCsei) : [JSON.parse(localCsei)]) : [],
                cure_history: localCure ? JSON.parse(localCure) : []
              })
            })
            if (res.ok) {
              localStorage.removeItem('final_csei_results')
              localStorage.removeItem('final_cure_history')
            } else {
              console.error('Sync failed with status:', res.status)
            }
          } catch (e) { console.error('Sync exception:', e) }
        }

        const { data: dbCsei } = await supabase
          .from('csei_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (dbCsei && dbCsei.length > 0) {
          setAllCsei(dbCsei)
          const latestScores = dbCsei[0].scores.map((s: any) => ({
            ...s,
            min: 40,
            max: 60
          }))
          setRadar(latestScores)
        }

        const { data: dbCure } = await supabase
          .from('cure_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const combined: HistoryLog[] = []
        if (dbCsei) {
          dbCsei.forEach(item => {
            const topEmotion = [...item.scores].sort((a: any, b: any) => b.A - a.A)[0]
            combined.push({
              id: `csei-${item.id}`,
              date: new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
              type: '칠정(七情) 진단 기록',
              summary: `[가장 높은 지표: ${topEmotion.subject} (${topEmotion.A}%)] 전반적 분석 결과입니다.`,
              tags: ['진단', '7정'],
              sentiment: 'neutral',
              isAssessment: true
            })
          })
        }
        if (dbCure) {
          dbCure.forEach(c => {
            combined.push({
              id: c.id,
              date: new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
              type: c.type || 'Session Record',
              summary: c.summary || c.situation || '',
              tags: c.tags || ['CBT'],
              sentiment: (c.sentiment || 'neutral') as any
            })
          })
        }
        setHistory(combined.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

      } else {
        setIsGuest(true)
        if (typeof window !== 'undefined') {
          const localCseiStr = localStorage.getItem('final_csei_results')
          const localCsei = localCseiStr ? JSON.parse(localCseiStr) : []
          const resultsArray = Array.isArray(localCsei) ? localCsei : (localCsei.scores ? [localCsei] : [])
          if (resultsArray.length > 0) {
            setAllCsei(resultsArray)
            const latestScores = resultsArray[0].scores.map((s: any) => ({
              ...s,
              min: 40,
              max: 60
            }))
            setRadar(latestScores)
          }
          const localCureStr = localStorage.getItem('final_cure_history')
          setHistory(localCureStr ? JSON.parse(localCureStr) : [])
        }
      }
    }
    loadData()
  }, [])

  const handleLegendClick = (e: any) => {
    const { dataKey } = e
    setHiddenSeries(prev => prev.includes(dataKey) ? prev.filter(s => s !== dataKey) : [...prev, dataKey])
  }

  const handleSelectHistory = (index: number) => {
    setSelectedIndex(index)
    if (allCsei[index]) {
      const selectedScores = allCsei[index].scores.map((s: any) => ({
        ...s,
        min: 40,
        max: 60
      }))
      setRadar(selectedScores)
    }
  }

  // 초기 로드 시 가이드 데이터 설정 로직 제거 (위의 useEffect와 통합됨)

  const trendData = [...allCsei].reverse().map(item => {
    const d = new Date(item.created_at || item.timestamp)
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
    const entry: any = { name: dateStr }
    item.scores.forEach((s: any) => { entry[s.subject] = s.A })
    return entry
  })

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#fffdfa] text-[#333] font-sans selection:bg-[#566e63]/20">
      <nav className="border-b border-gray-100 px-6 md:px-10 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="font-extrabold text-2xl text-[#4a5c53] tracking-tighter">파이널 서비스</Link>
        <div className="hidden md:flex gap-12 text-[10px] font-extrabold tracking-[0.2em] text-gray-600">
           <Link href="/select" className="hover:text-[#566e63] transition-colors">인지재구성(Cure)</Link>
           <Link href="/my-situation" className="text-[#566e63] border-b-2 border-[#566e63] pb-1">마이페이지</Link>
           <Link href="/chat" className="hover:text-[#566e63] transition-colors">심리상담 챗봇</Link>
        </div>
        {!isGuest ? (
          <button onClick={logout} className="flex items-center gap-2 group">
             <div className="w-10 h-10 rounded-full bg-[#f0f2f0] flex items-center justify-center text-[#566e63] group-hover:bg-[#566e63] group-hover:text-white transition-all overflow-hidden shadow-inner">
               <LogOut size={16} />
             </div>
             <span className="text-[10px] font-bold text-gray-600 group-hover:text-[#566e63] hidden sm:inline">로그아웃</span>
          </button>
        ) : (
          <Link href="/login" className="bg-[#566e63] text-white px-6 py-2.5 rounded-full text-[10px] font-bold tracking-widest hover:bg-[#43574d] hover:-translate-y-0.5 transition-all shadow-lg active:scale-95">로그인 / 회원가입</Link>
        )}
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 fade-in">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4">안녕하세요.</h1>
            <p className="text-gray-600 font-medium text-lg md:text-xl">당신의 마음은 하나의 안식처입니다. 여기 그 청사진이 있습니다.</p>
            
            {allCsei.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                <Link href="/result" className="flex items-center gap-3 bg-[#566e63] text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-[#43574d] hover:-translate-y-1 transition-all active:scale-95 group">
                  <Activity size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>✨ 가장 최근 진단 결과 요약 보기</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            )}
            
            {/* ✨ 대시보드 강화: 추천 훈련 숏컷 섹션 */}
            {allCsei.length > 0 && (
              <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 w-full max-w-3xl">
                {(() => {
                  const latestScores = allCsei[0].scores;
                  let attentionEmotions = latestScores.filter((s: any) => s.group === 'risk' || s.group === 'caution').sort((a: any, b: any) => b.A - a.A);
                  
                  // 명상 완료 이력 필터링 로직
                  try {
                    if (typeof window !== 'undefined') {
                      const doneLog = JSON.parse(localStorage.getItem('completed_meditations') || '{}')
                      const testDate = new Date(allCsei[0].created_at || allCsei[0].timestamp).getTime()
                      
                      // 가장 최근 테스트 이후에 해당 명상을 100% 클리어했다면 추천에서 제외
                      attentionEmotions = attentionEmotions.filter((emotion: any) => {
                        const doneAt = doneLog[emotion.subject]
                        if (!doneAt) return true // 기록 없으면 추천에 띄움
                        return doneAt < testDate // 클리어 날짜가 과거 테스트보다 예전이라면 다시 띄움
                      })
                    }
                  } catch (e) {
                    console.error('완료 이력 필터링 오류', e)
                  }

                  if (attentionEmotions.length === 0) {
                    return (
                      <div className="bg-[#f0f9f3] border border-[#d1e8da] rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Smile size={24} className="text-[#2fa65a]" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-[#222] text-sm">현재 모든 감정이 안정권입니다</h3>
                            <p className="text-xs text-gray-500 font-medium">특별히 권장되는 치료 훈련이 없습니다. 평온한 하루를 보내세요.</p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-sm text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                        <Brain size={14} className="text-[#566e63]" /> 진행 권장 훈련
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {attentionEmotions.map((emotion: any, idx: number) => {
                          const isFearFright = emotion.subject.includes('공') || emotion.subject.includes('두려움') || emotion.subject.includes('경') || emotion.subject.includes('놀람');
                          const isRisk = emotion.group === 'risk';
                          
                          return (
                            <Link 
                              key={idx}
                              href={`/meditation/${encodeURIComponent(emotion.subject)}`}
                              className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md group flex flex-col justify-between
                                ${isRisk ? 'bg-red-50/50 border-red-200' : 'bg-orange-50/50 border-orange-200'}
                              `}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold ${isRisk ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {emotion.groupLabel}
                                </div>
                                {isFearFright && <div className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">CBT 병행 권장</div>}
                              </div>
                              
                              <div>
                                <h4 className="font-extrabold text-[#222] text-lg mb-1">{emotion.subject} 치유 명상</h4>
                                <p className="text-xs text-gray-500 font-medium mb-3">T-점수 {Math.round(emotion.A)}점으로 집중 관리가 필요합니다.</p>
                              </div>
                              
                              <div className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors
                                ${isRisk ? 'bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white' : 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white'}
                              `}>
                                훈련 시작하기 <ArrowRight size={14} />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
          {isGuest && (
            <div className="bg-[#fff9e6] border border-[#f5e1a4] p-5 rounded-[30px] flex items-center gap-4 shadow-sm animate-pulse">
               <AlertCircle className="text-[#b48d1a]" size={24} />
               <p className="text-[#856404] text-xs font-bold leading-tight">게스트 모드: 로그인하면 데이터를 기기에 상관없이 동기화할 수 있습니다.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 mb-20 fade-in slide-in-bottom delay-100">
          <div className="bg-[#fcfaf7] rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100/50 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h2 className="text-xl font-bold text-[#4a5c53]">칠정(七情) 프로파일</h2>
                <p className="text-xs text-gray-600 mt-1 font-medium italic">당신의 마음을 구성하는 7가지 요소</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/60 p-1 rounded-full border border-gray-100 flex shadow-sm">
                  <button onClick={() => setViewMode('radar')} className={`p-2 rounded-full transition-all ${viewMode === 'radar' ? 'bg-[#566e63] text-white shadow-md' : 'text-gray-600 hover:text-gray-600'}`}><LayoutGrid size={16} /></button>
                  <button onClick={() => setViewMode('line')} className={`p-2 rounded-full transition-all ${viewMode === 'line' ? 'bg-[#566e63] text-white shadow-md' : 'text-gray-600 hover:text-gray-600'}`}><TrendingUp size={16} /></button>
                </div>
                {allCsei.length > 0 && viewMode === 'radar' && (
                  <div className="relative">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#566e63]" />
                    <select value={selectedIndex} onChange={(e) => handleSelectHistory(Number(e.target.value))} className="bg-white pl-10 pr-4 py-2.5 rounded-full text-xs font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-[#566e63]/10 shadow-sm text-[#4a5c53] appearance-none cursor-pointer">
                      {allCsei.map((item, idx) => (<option key={idx} value={idx}>{new Date(item.created_at || item.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 진단</option>))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full h-[400px] md:h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'radar' ? (
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radar}>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a5c53', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    
                    {/* 가이드 영역 (정상 범위: 40~60) */}
                    <Radar
                      name="정상 범위"
                      dataKey="max"
                      stroke="#566e63"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      fill="#566e63"
                      fillOpacity={0.18}
                      isAnimationActive={false}
                    />
                    
                    <Radar name="나의 상태" dataKey="A" stroke="#4a5c53" strokeWidth={2.5} fill="#566e63" fillOpacity={0.4} />
                    
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (!data.subject) return null;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-200">
                              <p className="text-[10px] font-bold text-gray-600 mb-1 tracking-widest uppercase">{data.subject}</p>
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-extrabold text-[#4a5c53]">{data.A}</span>
                                <span className="text-[10px] font-bold text-[#566e63]">T-score</span>
                              </div>
                              <div className="pt-2 border-t border-gray-50 flex flex-col gap-1">
                                <p className="text-[11px] font-bold text-gray-500">원점수: <span className="text-[#222]">{data.rawScore}점</span></p>
                                <p className="text-[11px] font-bold text-gray-500">상태: <span className={data.group === 'risk' ? 'text-red-500' : data.group === 'caution' ? 'text-amber-500' : 'text-green-600'}>{data.groupLabel}</span></p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                ) : (
                  <LineChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    
                    {/* 구간별 배경 색상 (ReferenceArea) */}
                    <ReferenceArea y1={40} y2={60} fill="#22c55e" fillOpacity={0.10} label={{ position: 'insideRight', value: '정상', fill: '#16a34a', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={60} y2={70} fill="#f59e0b" fillOpacity={0.10} label={{ position: 'insideRight', value: '주의', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={30} y2={40} fill="#f59e0b" fillOpacity={0.10} />
                    <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.07} label={{ position: 'insideRight', value: '위험', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={0} y2={30} fill="#ef4444" fillOpacity={0.07} />
                    
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      onClick={handleLegendClick} 
                      wrapperStyle={{ paddingTop: '40px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Line type="monotone" name="희 (喜)" dataKey="희 (喜)" hide={hiddenSeries.includes('희 (喜)')} stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="노 (怒)" dataKey="노 (怒)" hide={hiddenSeries.includes('노 (怒)')} stroke="#ff8042" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="사 (思)" dataKey="사 (思)" hide={hiddenSeries.includes('사 (思)')} stroke="#ffbb28" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="우 (憂)" dataKey="우 (憂)" hide={hiddenSeries.includes('우 (憂)')} stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="비 (悲)" dataKey="비 (悲)" hide={hiddenSeries.includes('비 (悲)')} stroke="#0088fe" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="공 (恐)" dataKey="공 (恐)" hide={hiddenSeries.includes('공 (恐)')} stroke="#bdc3c7" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" name="경 (驚)" dataKey="경 (驚)" hide={hiddenSeries.includes('경 (驚)')} stroke="#9b59b6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-7 gap-1.5 md:gap-4 mt-10">
              {radar.map((item: any, idx) => {
                const group = item.group || 'normal'
                const groupLabel = item.groupLabel || '정상군'
                const bgColor = group === 'risk' ? 'bg-red-50' : group === 'caution' ? 'bg-yellow-50' : 'bg-[#f0ece5]'
                const textColor = group === 'risk' ? 'text-red-600' : group === 'caution' ? 'text-amber-600' : 'text-[#4a5c53]'
                const borderColor = group === 'risk' ? 'border-red-100' : group === 'caution' ? 'border-yellow-100' : 'border-white/50'

                return (
                  <div key={idx} className={`${bgColor} rounded-xl sm:rounded-3xl py-2 sm:py-4 px-1 sm:px-6 text-center border ${borderColor} shadow-sm transition-all hover:scale-105`}>
                    <div className={`text-base sm:text-2xl font-extrabold ${textColor}`}>{item.A}</div>
                    <div className="text-[8px] sm:text-[10px] font-bold text-gray-600 tracking-tighter sm:tracking-widest mt-0.5 sm:mt-1 uppercase truncate">
                      {item.subject.replace(/[^가-힣]/g, '')}
                    </div>
                    <div className={`hidden sm:inline-block text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${group === 'risk' ? 'bg-red-100 text-red-700' : group === 'caution' ? 'bg-yellow-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                       {groupLabel}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#f0ece5] rounded-[30px] p-8 md:p-10 border border-gray-100/50 shadow-sm mb-16 fade-in slide-in-bottom delay-150 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
               <h3 className="text-xl font-extrabold text-[#222] mb-2 tracking-tight">트래커: 다음 목표</h3>
               <p className="text-sm font-medium text-gray-500 mb-0">마음의 안정을 위한 장기 과제를 달성해 보세요.</p>
           </div>
           
           <div className="flex items-center gap-5 bg-white p-5 rounded-[24px] pl-6 w-full md:w-auto md:min-w-[400px] border border-gray-50/50 shadow-sm">
                  <div className="bg-white p-3 rounded-2xl text-[#566e63] shadow-sm border border-gray-100"><Moon size={20} /></div>
                  <div className="flex-1">
                     <div className="text-sm font-bold text-[#222] mb-1">수면 패턴 일정하게 유지하기</div>
                     <div className="text-xs text-gray-500 font-medium">현재 주 4/7일 달성 중</div>
                     <div className="h-2 w-full bg-white/60 rounded-full mt-3 overflow-hidden border border-white/50">
                       <div className="h-full bg-[#566e63] w-[57%] rounded-full shadow-[0_0_10px_rgba(86,110,99,0.3)] transition-all duration-1000" />
                     </div>
                  </div>
               </div>
              </div>

        <div className="mb-20 fade-in slide-in-bottom delay-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold mb-2 tracking-tight">히스토리 및 기록</h2>
              <p className="text-gray-600 font-medium text-sm">과거의 인지 재구성 및 심리 진단 기록입니다.</p>
            </div>
            <div className="flex gap-3">
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#566e63] transition-colors" />
                <input type="text" placeholder="기록 검색..." className="bg-white px-10 py-3 rounded-full text-sm outline-none border border-gray-100 focus:ring-4 focus:ring-[#566e63]/5 w-[240px] shadow-sm transition-all" />
              </div>
              <button className="bg-white w-12 h-12 border border-gray-100 shadow-sm rounded-full flex items-center justify-center text-gray-500 hover:bg-[#566e63] hover:text-white transition-all active:scale-90"><Filter size={18} /></button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {history.map((log: HistoryLog) => (
              <div 
                key={log.id} 
                onClick={() => {
                  if (log.isAssessment) {
                    router.push(`/result?id=${log.id}`)
                  }
                }}
                className={`bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full ${log.isAssessment ? 'relative ring-2 ring-[#566e63]/5' : ''}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest ${log.isAssessment ? 'bg-[#566e63] text-white' : 'bg-[#f5f5f5] text-gray-500'}`}>{log.date}</span>
                  <div>
                    {log.sentiment === 'positive' && <Smile size={20} className="text-[#566e63]" />}
                    {log.sentiment === 'neutral' && <Meh size={20} className="text-[#8c7457]" />}
                    {log.sentiment === 'negative' && <Frown size={20} className="text-[#b13c3c]" />}
                  </div>
                </div>
                <h3 className="font-bold text-lg leading-tight mb-4 flex-1 group-hover:text-[#566e63] transition-colors">{log.type}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-8 line-clamp-3">{log.summary}</p>
                <div className="flex justify-between items-center mt-auto border-t border-gray-50 pt-5">
                  <div className="flex gap-2">
                    {log.tags.map((tag: string, idx: number) => (<span key={idx} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors ${log.isAssessment ? 'bg-[#f0ece5] text-[#4a5c53]' : 'bg-[#e8efe9] text-[#566e63]'}`}>#{tag}</span>))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold flex items-center gap-1 text-gray-600 group-hover:text-[#566e63] transition-colors">
                      요약보기 <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button className="bg-white border border-gray-100 shadow-sm hover:bg-[#f0ece5] text-[#4a5c53] font-bold text-sm px-10 py-3.5 rounded-full transition-all active:scale-95">이전 기록 더 불러오기</button>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 md:px-10 py-16 flex flex-col md:flex-row justify-between items-center gap-8 mt-20 bg-white">
        <div>
          <div className="font-extrabold text-lg mb-1 text-[#4a5c53] tracking-tighter">파이널 서비스</div>
          <p className="text-[10px] text-gray-600 font-medium">© 2024 파이널 서비스. 마음의 안식처.</p>
        </div>
        <div className="flex gap-12 text-[10px] font-extrabold text-gray-600 uppercase tracking-[0.2em]">
          <Link href="#" className="hover:text-[#566e63] transition-colors">소개</Link>
          <Link href="#" className="hover:text-[#566e63] transition-colors">개인정보처리방침</Link>
          <Link href="#" className="hover:text-[#566e63] transition-colors">문의하기</Link>
          <Link href="#" className="hover:text-[#566e63] transition-colors">이용약관</Link>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards; opacity: 0; }
        .slide-in-bottom { animation: slideInBottom 1s cubic-bezier(0.2, 0, 0.2, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 200ms; }
        .delay-200 { animation-delay: 400ms; }
        .delay-300 { animation-delay: 600ms; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInBottom { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
