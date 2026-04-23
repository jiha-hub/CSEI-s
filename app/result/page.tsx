'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceArea,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { Globe, Sparkles, AlertCircle, TrendingUp, LayoutGrid, Calendar, User, Bell, Settings, Activity, BrainCircuit, HeartPulse, ChevronRight, CheckCircle2, Smile, ArrowRight, ClipboardList } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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
  isPostMeditation?: boolean
  relatedPreTimestamp?: string
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

const EN_SUBJECT_MAP: Record<string, string> = {
  '희': 'JOY', '기쁨': 'JOY',
  '노': 'ANGER', '분노': 'ANGER',
  '우': 'THOUGHT', '고민': 'THOUGHT',
  '사': 'DEPRESSION', '근심': 'DEPRESSION',
  '비': 'SORROW', '슬픔': 'SORROW',
  '공': 'FRIGHT', '두려움': 'FRIGHT',
  '경': 'FEAR', '놀람': 'FEAR'
}

const TEXTS: Record<string, any> = {
  ko: {
    loading: '결과 데이터를 파싱하는 중 오류가 발생했습니다.',
    notFoundTitle: '분석 결과를 찾을 수 없습니다',
    notFoundDesc: '설문을 먼저 완료해 주세요.',
    goSurvey: '설문하러 가기',
    preScore: '사전 점수(Pre)',
    postScore: '사후 점수(Post)',
    currScore: '현재 점수',
    scoreChange: '점수 변화',
    guide: 'MoodB 평균 가이드',
    summaryTitle: 'RESULT SUMMARY',
    mainTitlePre: '명상 효과 분석 리포트',
    mainTitleNormal: '나의 감정 진단 요약',
    radarTitle: '7가지 감정 프로파일',
    radarDescPre: '명상 전후의 감정 변화를 한눈에 비교해 보세요.',
    radarDescNormal: '당신의 마음을 구성하는 7가지 요소',
    preLegend: '사전(Pre)',
    postLegend: '사후(Post)',
    lineTitle: '7가지 감정 지수 프로파일 (Line Chart)',
    statusSummary: '현 상태 요약',
    compIndex: 'Comprehensive Index',
    overallTscore: '전체 종합지수',
    groupRisk: '위험 단계',
    groupCaution: '주의 단계',
    groupNormal: '안정 단계',
    groupRiskLabel: '위험',
    groupCautionLabel: '주의',
    groupNormalLabel: '안정',
    allStable: '모든 감정 영역이 통제 범위 내에 있습니다.',
    deepReportBtn: '의학적 심층 리포트 보기',
    worryTitle: '어떤 감정을 먼저 다룰까요?',
    worryDesc: '방금 검사에서 집중 관리가 필요하다고 판정된 감정들입니다. 심리 치료를 선택하고 마음의 짐을 가볍게 내려놓으세요.',
    startHeal: '치유 시작하기',
    stateStr: '상태',
    noWorryTitle: '현재는 치유가',
    noWorryTarget: '가장 급한 감정',
    noWorryEnd: '이 없어요',
    noWorryDesc: '모든 감정 지표가 안정권입니다. 치유를 서두르기보다 오늘의 평안함을 유지하기 위한 가벼운 마음챙김 명상이나 산책을 추천합니다.',
    recProgramBtn: '추천 프로그램 둘러보기',
    historyTitle: '나의 이전 진단 목록',
    level: '단계',
  },
  en: {
    loading: 'Error parsing result data.',
    notFoundTitle: 'Analysis Result Not Found',
    notFoundDesc: 'Please complete the questionnaire first.',
    goSurvey: 'Go to Survey',
    preScore: 'Pre Score',
    postScore: 'Post Score',
    currScore: 'Current Score',
    scoreChange: 'Score Change',
    guide: 'MoodB Mean Guide',
    summaryTitle: 'RESULT SUMMARY',
    mainTitlePre: 'Meditation Effect Analysis Report',
    mainTitleNormal: 'My Emotion Diagnostic Summary',
    radarTitle: '7 Emotion Profiles',
    radarDescPre: 'Compare emotional changes before and after meditation at a glance.',
    radarDescNormal: 'The 7 elements that make up your mind',
    preLegend: 'Pre',
    postLegend: 'Post',
    lineTitle: '7 Emotion Index Profile (Line Chart)',
    statusSummary: 'Status Summary',
    compIndex: 'Comprehensive Index',
    overallTscore: 'Overall T-Score',
    groupRisk: 'Risk Level',
    groupCaution: 'Caution Level',
    groupNormal: 'Stable Level',
    groupRiskLabel: 'Risk',
    groupCautionLabel: 'Caution',
    groupNormalLabel: 'Stable',
    allStable: 'All emotional areas are within the control range.',
    deepReportBtn: 'View In-depth Medical Report',
    worryTitle: 'Which emotion should we address first?',
    worryDesc: 'These are the emotions determined to require intensive care in the recent test. Choose psychotherapy and gently relieve the burden on your mind.',
    startHeal: 'Start Healing',
    stateStr: 'State',
    noWorryTitle: 'Currently, there are no emotions',
    noWorryTarget: 'in urgent need',
    noWorryEnd: 'of healing',
    noWorryDesc: 'All emotion indicators are in the stable zone. Rather than rushing to heal, we recommend light mindfulness meditation or walking to maintain your peace today.',
    recProgramBtn: 'Explore Recommended Programs',
    historyTitle: 'My Previous Diagnosis History',
    level: 'Level',
  }
}

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idQuery = searchParams.get('id')
  
  const [lang, setLang] = useState<'ko'|'en'>('ko')
  const [result, setResult] = useState<ResultData | null>(null)
  const [preResult, setPreResult] = useState<ResultData | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)
  const [allResults, setAllResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)

  const t = TEXTS[lang]
  const toggleLanguage = () => setLang(prev => (prev === 'ko' ? 'en' : 'ko'))

  const getSubject = (korName: string) => {
    const raw = korName.replace(/[^가-힣]/g, '') || korName
    if (lang === 'en' && EN_SUBJECT_MAP[raw]) return EN_SUBJECT_MAP[raw]
    return raw
  }
  
  const getGroupLabel = (group: string) => {
    if (group === 'risk') return t.groupRiskLabel;
    if (group === 'caution') return t.groupCautionLabel;
    return t.groupNormalLabel;
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let resultsArray: ResultData[] = []
        let foundRecord: ResultData | undefined

        const stored = localStorage.getItem('final_csei_results')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed) {
            resultsArray = Array.isArray(parsed) ? parsed : (parsed.scores ? [parsed] : [])
          }
        }

        if (user) {
          const { data, error } = await supabase.from('csei_results').select('*').order('created_at', { ascending: false })
          if (!error && data && data.length > 0) {
            const dbData = data as any[]
            dbData.forEach(dbItem => {
              if (!resultsArray.find(r => (r.id && r.id == dbItem.id) || (r.timestamp && r.timestamp == dbItem.timestamp))) {
                resultsArray.push(dbItem)
              }
            })
          }
        }

        resultsArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        if (resultsArray.length > 0) {
          if (idQuery) {
            foundRecord = resultsArray.find((r: any) => 
              (r.id == idQuery || `csei-${r.id}` == idQuery || r.timestamp == idQuery)
            )
          }
          if (!foundRecord) {
            foundRecord = resultsArray[0]
          }
        }

        setAllResults(resultsArray)
        
        if (foundRecord) {
          setResultId(foundRecord.id ? `csei-${foundRecord.id}` : foundRecord.timestamp)
          setResult(foundRecord)

          if ((foundRecord as any).isPostMeditation && (foundRecord as any).relatedPreTimestamp) {
             const pre = resultsArray.find((r: any) => r.timestamp === (foundRecord as any).relatedPreTimestamp)
             if (pre) setPreResult(pre)
          }
        }
      } catch (e) {
        console.error(t.loading, e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [idQuery])

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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.notFoundTitle}</h2>
        <p className="text-gray-500 mb-8">{t.notFoundDesc}</p>
        <Link href="/questionnaire" className="bg-[#566e63] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#4a5c53] transition-colors">
          {t.goSurvey}
        </Link>
      </div>
    )
  }

  const { scores } = result
  const attentionRequired = scores.filter(s => s.group !== 'normal')

  const getEmotionComment = (score: EmotionScore) => {
    const sub = getSubject(score.subject)
    if (lang === 'en') {
      if (score.group === 'risk') return `'${sub}' emotion is at a risk level. Special care and attention are needed.`
      if (score.group === 'caution') return `'${sub}' emotion is somewhat unstable. Relaxation might help.`
      return `Stable in terms of '${sub}'.`
    }
    if (score.group === 'risk') return `'${sub}' 감정이 위험 수준입니다. 각별한 관리와 주의가 필요합니다.`
    if (score.group === 'caution') return `'${sub}' 감정이 다소 불안정합니다. 편안한 휴식이 도움이 될 수 있습니다.`
    return `'${sub}' 측면에서 안정적입니다.`
  }

  const getOverallSummary = () => {
    if (attentionRequired.length > 0) {
      const mainEmotion = attentionRequired.reduce((prev, current) => 
        (current.group === 'risk' ? current : prev), attentionRequired[0])
      const mainSub = getSubject(mainEmotion.subject)
      const mainLbl = getGroupLabel(mainEmotion.group)
      if (lang === 'en') {
         return `Emotions requiring care have been detected. In particular, the ${mainSub} indicator is in a ${mainLbl} state. It is advisable to explore professional approaches focusing on this area.`
      }
      return `현재 돌봄이 필요한 감정들이 감지되었습니다. 특히 ${mainSub} 지표가 ${mainLbl} 상태입니다. 이 부분을 중심으로 전문적인 접근 방향을 모색해보는 것이 좋습니다.`
    }
    if (lang === 'en') return 'Your overall emotional state is currently well within the normal range and very peaceful. Please continue light mindfulness meditations or daily care to maintain this stability.'
    return '현재 전체적인 감정 상태가 모두 정상 범위에 있으며 매우 평온합니다. 지금의 안정을 유지하기 위한 가벼운 마음챙김 명상이나 일상 속 관리를 계속해 주세요.'
  }

  const radarData = scores.map(s => {
    const preScore = preResult?.scores.find(ps => ps.subject === s.subject)
    return {
      subject: getSubject(s.subject),
      fullSubject: s.subject,
      A: s.A, 
      B: preScore ? preScore.A : null, 
      mean: 50, 
      groupLabel: getGroupLabel(s.group),
      group: s.group,
      preGroupLabel: preScore ? getGroupLabel(preScore.group) : undefined
    }
  })

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-100 min-w-[200px] animate-in fade-in zoom-in duration-200">
          <div className="text-sm font-black text-gray-400 mb-3 tracking-widest uppercase">{data.subject}</div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {preResult ? t.postScore : t.currScore}
                </span>
                <span className={`text-lg font-black ${GROUP_TEXT_COLOR[data.group]}`}>
                   {data.groupLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-500">T-score</span>
                <div className="text-3xl font-black text-[#222]">{data.A}</div>
              </div>
            </div>

            {preResult && data.B !== null && (
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{t.preScore}</span>
                  <span className="text-xs font-bold text-gray-500">{data.preGroupLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-[#f5ebd9] rounded-md text-[10px] font-bold text-[#bfa588]">T-score</span>
                   <div className="text-xl font-bold text-[#bfa588]">{data.B}</div>
                </div>
              </div>
            )}
          </div>
          {preResult && data.B !== null && (
             <div className="mt-4 py-2 bg-gray-50 rounded-xl text-center">
                <span className="text-[10px] font-bold text-gray-400">
                   {t.scoreChange}: {data.A - data.B > 0 ? `+${data.A - data.B}` : data.A - data.B} (T-score)
                </span>
             </div>
          )}
        </div>
      )
    }
    return null
  }

  const overallGroupLabel = result.overallGroup === 'risk' ? t.groupRisk : result.overallGroup === 'caution' ? t.groupCaution : t.groupNormal

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-[#333] pb-24 relative">
      <Navbar />

      {/* Language Toggle */}
      <div className="absolute top-24 right-6 md:right-12 z-50">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 border-2 border-gray-200 transition-all text-[#566e63] font-black text-base"
        >
          <Globe size={20} />
          {lang === 'ko' ? 'ENG' : 'KOR'}
        </button>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 pt-10">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="text-sm font-bold text-[#566e63] tracking-[0.2em] uppercase mb-4 block">
            {t.summaryTitle}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#222]">
            {preResult ? t.mainTitlePre : t.mainTitleNormal}
          </h1>
        </div>

        <div className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4">
            {radarData.map((score, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border ${GROUP_COLOR[score.group]} transition-all`}
              >
                <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tighter text-[#566e63] mb-2 text-center w-full truncate">
                  {score.subject}
                </span>
                <div className="flex items-center gap-1.5 mb-2">
                   <span className="px-1.5 py-0.5 bg-white/50 rounded text-[10px] font-black text-gray-400">T-score</span>
                   <span className="text-3xl font-black">{score.A}</span>
                </div>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/60 ${GROUP_TEXT_COLOR[score.group]} whitespace-nowrap`}>
                  {score.groupLabel}
                </div>
              </div>
            ))}
            <div className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border ${GROUP_COLOR[result.overallGroup]} transition-all bg-[#566e63]/5`}>
              <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tighter text-[#566e63] mb-2 text-center w-full truncate">
                {lang === 'ko' ? '종합 지수' : 'TOTAL'}
              </span>
              <div className="flex items-center gap-1.5 mb-2">
                 <span className="px-1.5 py-0.5 bg-white/50 rounded text-[10px] font-black text-gray-400">T-score</span>
                 <span className="text-3xl font-black">{Math.round(result.overallTScore)}</span>
              </div>
              <div className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/60 ${GROUP_TEXT_COLOR[result.overallGroup]} whitespace-nowrap`}>
                {overallGroupLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="text-center mb-6 w-full flex flex-col justify-between items-center sm:flex-row">
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-[#222]">{t.radarTitle}</h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {preResult ? t.radarDescPre : t.radarDescNormal}
                </p>
              </div>
              {preResult && (
                <div className="flex gap-4 mt-4 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f87171] opacity-50"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.preLegend}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#566e63]"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.postLegend}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} 
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <RechartsTooltip content={<CustomRadarTooltip />} />
                  <Radar name="Mean" dataKey="mean" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" fill="none" fillOpacity={0} />
                  {preResult && <Radar name="Pre Score" dataKey="B" stroke="#f87171" strokeWidth={2} strokeOpacity={0.5} fill="#f87171" fillOpacity={0.1} />}
                  <Radar name="Post Score" dataKey="A" stroke="#566e63" strokeWidth={preResult ? 3 : 2} fill="#566e63" fillOpacity={0.15} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Activity size={20} /> {t.lineTitle}
            </h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={radarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <ReferenceArea y1={40} y2={60} fill="#22c55e" fillOpacity={0.05} />
                  <ReferenceArea y1={60} y2={70} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={30} y2={40} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.05} />
                  <ReferenceArea y1={0} y2={30} fill="#ef4444" fillOpacity={0.05} />

                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12, fill: '#666', fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12, fill: '#999' }} 
                    axisLine={false} 
                    tickLine={false} 
                    label={{ value: 'T-score', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                    formatter={(val: any, name: any, props: any) => [val, props.payload.groupLabel]}
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
        </div>

        {/* Report Component below the charts */}
        <div className="mb-16 bg-[#f9faf9] p-8 md:p-12 rounded-[32px] border border-[#e8e0d5] flex flex-col lg:flex-row gap-8 justify-between items-start animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
             <div className="flex-1">
              {/* 제목 + 심층 리포트 버튼을 같은 행에 배치 */}
              <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-200">
                <h3 className="text-2xl font-extrabold text-[#222] tracking-tight">{t.statusSummary}</h3>
                <Link href={`/report?id=${resultId}`} className="shrink-0 bg-white border border-gray-200 text-[#4a5c53] font-bold py-3 px-5 rounded-2xl inline-flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm group text-sm">
                   <BrainCircuit size={16} className="group-hover:text-[#566e63]" />
                   {t.deepReportBtn}
                   <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

             <p className="text-[#555] font-medium leading-relaxed mb-8 text-[15px] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               {getOverallSummary()}
             </p>

             <div className="space-y-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               {attentionRequired.map((score, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <AlertCircle size={16} className={`mt-0.5 ${GROUP_TEXT_COLOR[score.group]} shrink-0`} />
                    <p className="text-sm text-gray-700 font-bold leading-normal">{getEmotionComment(score)}</p>
                  </div>
               ))}
               {attentionRequired.length === 0 && (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 text-green-500 shrink-0" />
                    <p className="text-sm text-gray-700 font-bold leading-normal">{t.allStable}</p>
                  </div>
               )}
             </div>
           </div>
        </div>

        {/* Emotions to Handle Next */}
        <div className="mb-20 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-300">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight text-[#222]">
              {t.worryTitle}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {t.worryDesc}
            </p>
          </div>

          {attentionRequired.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {attentionRequired.map((score, idx) => {
                const sub = getSubject(score.subject)
                return (
                  <div 
                    key={idx}
                    className="w-full sm:w-[280px] bg-white border-2 border-[#eaeced] rounded-[24px] p-8 text-center flex flex-col items-center"
                  >
                    <div className={`w-full py-4 rounded-2xl flex items-center justify-center font-black text-xl mb-4 ${GROUP_COLOR[score.group]}`}>
                      {sub}
                    </div>
                    <div className={`text-xs font-bold mb-6 ${GROUP_TEXT_COLOR[score.group]}`}>{getGroupLabel(score.group)} {t.stateStr}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-[#f0f9f3] border border-[#d1e8da] rounded-[32px] p-10 md:p-14 text-center max-w-3xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-[#e3f4ea] rounded-full flex items-center justify-center mb-6">
                <Smile size={32} className="text-[#2fa65a]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#222] mb-4">
                {t.noWorryTitle} <span className="text-[#2fa65a]">{t.noWorryTarget}</span>{t.noWorryEnd}
              </h3>
              <p className="text-gray-600 font-medium mb-8 max-w-md leading-relaxed">
                {t.noWorryDesc}
              </p>
              <Link href="/" className="block w-full text-center bg-gray-100 text-[#566e63] px-8 py-4 rounded-full font-bold shadow-sm hover:bg-gray-200 transition-colors mt-4">
                {lang === 'ko' ? '홈으로 돌아가기' : 'Return to Home'}
              </Link>
            </div>
          )}
        </div>

        {/* History */}
        {allResults.length > 1 && (
          <div className="mb-20 pt-10 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-500">
            <h3 className="text-xl font-extrabold text-[#222] mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#566e63]" />
              {t.historyTitle}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allResults.map((rec, idx) => {
                const recId = rec.id ? `csei-${rec.id}` : rec.timestamp;
                const isCurrent = recId === resultId;
                const d = new Date(rec.timestamp);
                const displayDate = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric', year: 'numeric' });
                
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
                      {rec.overallGroup === 'risk' ? t.groupRiskLabel : rec.overallGroup === 'caution' ? t.groupCautionLabel : t.groupNormalLabel} {t.level}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isCurrent ? 'bg-white/20 text-white' : 'bg-[#e8efe9] text-[#566e63]'}`}>T-score</span>
                      <div className={`text-xs font-medium ${isCurrent ? 'text-white/80' : 'text-gray-500'}`}>
                        {Math.round(rec.overallTScore)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-16 flex justify-center">
          <Link 
            href="/" 
            className="bg-white border-2 border-[#566e63] text-[#566e63] px-10 py-4 rounded-full font-black text-lg hover:bg-[#566e63] hover:text-white transition-all shadow-md flex items-center gap-2"
          >
            <Globe size={20} />
            홈으로 돌아가기 (다시 진단하기)
          </Link>
        </div>
      </main>
      <Footer />
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
