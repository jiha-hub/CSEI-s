'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { BrainCircuit, ChevronRight, Download, Activity, HeartPulse, ChevronLeft, Calendar as CalendarIcon, User, Info, Globe } from 'lucide-react'

const EN_SUBJECT_MAP: Record<string, string> = {
  '희': 'JOY', '기쁨': 'JOY',
  '노': 'ANGER', '분노': 'ANGER',
  '우': 'THOUGHT', '고민': 'THOUGHT',
  '사': 'DEPRESSION', '근심': 'DEPRESSION',
  '비': 'SORROW', '슬픔': 'SORROW',
  '공': 'FRIGHT', '두려움': 'FRIGHT',
  '경': 'FEAR', '놀람': 'FEAR'
}

const TEXTS = {
  ko: {
    notFoundTitle: '진단 기록을 찾을 수 없습니다',
    notFoundDesc: '검사가 정상적으로 완료되지 않았거나 데이터가 존재하지 않습니다.',
    btnReturn: '마이페이지로 돌아가기',
    navHome: '홈',
    navCure: '인지재구성(Cure)',
    navMy: '마이페이지',
    navChat: '상담 챗봇',
    btnPdf: 'PDF 저장',
    btnBack: '뒤로',
    confidential: 'CONFIDENTIAL',
    reportTitle: '심리 진단 심층 리포트',
    reportSub: 'Clinical 7-Emotions Evaluation Report',
    dateLabel: '진단 일자',
    typeLabel: '진단 구분',
    typeMale: '남성',
    typeFemale: '여성',
    typeAgeSuffix: '대',
    dbLabel: '종합 dB (전체)',
    judgementLabel: '종합 판정',
    judgeRisk: '위험 구간',
    judgeCaution: '주의 요망',
    judgeNormal: '정상 안정',
    sectionA: '종합 의학 소견',
    tagDB: 'dB 기준 산출',
    tagNorm: '임상 규준 적용완료',
    sectionB: '7가지 감정 수치 심층 분석',
    riskTag: '위험', cautionTag: '주의', normalTag: '정상',
    medicalAlert: '유의 사항 및 신체 증상',
    sectionC: '권장 가이드라인',
    guideText: '"감정은 흐름입니다. 하나의 감정에 매몰되는 것이 문제 감정입니다. 다른 감정으로 대체할 수 있도록, 자연스러운 흐름과 상호견제에 의해서 나의 감정은 흘러갑니다. 현재의 핵심 감정을 다른 감정으로 옮기는 방법이 오지상승요법입니다. 나의 감정 상태에 맞는 오지상승요법을 MoodB 명상으로 만나보세요."',
    btnMeditate: '지금 바로 치유 명상 시작하기',
    footerText: '— FINAL SERVICE CONFIDENTIAL REPORT —'
  },
  en: {
    notFoundTitle: 'Diagnosis Record Not Found',
    notFoundDesc: 'The test was not completed normally or the data does not exist.',
    btnReturn: 'Return to My Page',
    navHome: 'Home',
    navCure: 'CBT (Cure)',
    navMy: 'My Page',
    navChat: 'Chatbot',
    btnPdf: 'Save PDF',
    btnBack: 'Back',
    confidential: 'CONFIDENTIAL',
    reportTitle: 'In-depth Psychological Report',
    reportSub: 'Clinical 7-Emotions Evaluation Report',
    dateLabel: 'Diagnosis Date',
    typeLabel: 'Category',
    typeMale: 'Male',
    typeFemale: 'Female',
    typeAgeSuffix: 's',
    dbLabel: 'Overall T-Score',
    judgementLabel: 'Overall Judgement',
    judgeRisk: 'Risk Zone',
    judgeCaution: 'Caution Required',
    judgeNormal: 'Normal & Stable',
    sectionA: 'Overall Clinical Opinion',
    tagDB: 'T-Score Base',
    tagNorm: 'Clinical Norm Applied',
    sectionB: 'In-depth Analysis of 7 Emotions',
    riskTag: 'Risk', cautionTag: 'Caution', normalTag: 'Normal',
    medicalAlert: 'Precautions & Physical Symptoms',
    sectionC: 'Recommended Guidelines',
    guideText: '"Emotion is a flow. Getting bogged down in a single emotion is what creates problematic feelings. By allowing emotions to flow naturally and maintain mutual checks and balances, we can transition to a healthier state. Experience MoodB meditation, tailored precisely to your current emotional state, to gently guide you towards serenity."',
    btnMeditate: 'Start Healing Meditation Now',
    footerText: '— FINAL SERVICE CONFIDENTIAL REPORT —'
  }
}

function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idQuery = searchParams.get('id')

  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<any | null>(null)
  const t = TEXTS[lang]

  const toggleLanguage = () => setLang(prev => (prev === 'ko' ? 'en' : 'ko'))
  
  const getSubject = (korName: string) => {
    const raw = korName.replace(/[^가-힣a-zA-Z]/g, '') || korName
    if (lang === 'en' && EN_SUBJECT_MAP[raw]) return EN_SUBJECT_MAP[raw]
    return raw
  }

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let allResultsArray: any[] = []
        let foundRecord = null

        const localCseiStr = localStorage.getItem('final_csei_results')
        if (localCseiStr) {
          const localCsei = JSON.parse(localCseiStr)
          if (localCsei) {
            allResultsArray = Array.isArray(localCsei) ? localCsei : (localCsei.scores ? [localCsei] : [])
          }
        }

        if (user) {
          const { data, error } = await supabase.from('csei_results').select('*').order('created_at', { ascending: false })
          if (!error && data && data.length > 0) {
            data.forEach(dbItem => {
              if (!allResultsArray.find(r => (r.id && r.id == dbItem.id) || (r.timestamp && r.timestamp == dbItem.timestamp))) {
                allResultsArray.push(dbItem)
              }
            })
          }
        }

        allResultsArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        if (allResultsArray.length > 0) {
          if (idQuery) {
            const rawId = idQuery.replace('csei-', '')
            foundRecord = allResultsArray.find((r: any) => r.id == rawId || r.timestamp == idQuery) || allResultsArray[0]
          } else {
            foundRecord = allResultsArray[0]
          }
        }

        if (foundRecord) {
          setReportData(foundRecord)
        }
      } catch (error) {
        console.error('Failed to load report:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReportData()
  }, [idQuery])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#566e63]"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] flex flex-col items-center justify-center p-6 text-center">
        <Activity size={48} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-extrabold text-[#222] mb-2">{t.notFoundTitle}</h2>
        <p className="text-gray-500 mb-8 max-w-sm">{t.notFoundDesc}</p>
        <button onClick={() => router.push('/')} className="bg-[#566e63] text-white px-8 py-3.5 rounded-full font-bold shadow hover:bg-[#43574d] transition-colors">
          {lang === 'en' ? 'Return to Home' : '홈으로 가기'}
        </button>
      </div>
    )
  }

  const scores: any[] = reportData.scores || []
  const detailScores = scores.filter(s => s.factor !== 'TOTAL' && s.subject !== '총합')
  const riskItems = detailScores.filter(s => s.group === 'risk')
  const cautionItems = detailScores.filter(s => s.group === 'caution')
  
  const totalTScore = reportData.overallTScore || reportData.overall_t_score || 0
  
  const createdDate = new Date(reportData.created_at || reportData.timestamp || Date.now())
  const dateString = createdDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  const getMedicalInsight = (factor: string, group: string) => {
    if (lang === 'en') {
      switch (factor) {
        case 'JOY': return group === 'risk' ? "Excessive Joy relaxes Qi too much, potentially straining the heart and causing distraction." : "An appropriate level of Joy aids physical and mental relaxation, but care should be taken to avoid overexcitement.";
        case 'ANGER': return group === 'risk' ? "Severe Anger causes Qi to abruptly rise, potentially harming the liver and causing headaches or indigestion." : "Traces of anger responses to stress are observed. Deep breathing and meditation are recommended to calm the rising heat.";
        case 'THOUGHT': return group === 'risk' ? "Excessive Thought causes Qi to stagnate, potentially harming the spleen and causing sleep disorders and loss of appetite." : "You're dwelling on many thoughts. Increase physical activity to disperse the energy concentrated in your head.";
        case 'DEPRESSION': return group === 'risk' ? "Deep Depression blocks Qi flow, potentially lowering lung function and causing shallow breathing." : "Mild depressive feelings are observed. Light aerobic exercise can increase lung capacity and circulate energy.";
        case 'SORROW': return group === 'risk' ? "Extreme Sorrow exhausts Qi, potentially harming the lungs and causing general lethargy." : "Sorrow is draining your energy. Please soothe your body with adequate rest and warm tea.";
        case 'FRIGHT': return group === 'risk' ? "Chronic Fright sinks Qi downwards, potentially harming the kidneys and causing chronic fatigue." : "Fear and anxiety are present. It's recommended to restore confidence by achieving small, manageable goals.";
        case 'FEAR': return group === 'risk' ? "Sudden Fear scatters Qi, potentially harming the heart and gallbladder, leading to anxiety disorders." : "Your autonomic nervous system is somewhat sensitive. A regular routine in a stable environment is recommended.";
        default: return "";
      }
    } else {
      switch (factor) {
        case 'JOY': return group === 'risk' ? "과도한 희(喜) 감정은 기(氣)를 느슨하게 하여 심장에 무리를 주고 산만함을 유발할 수 있습니다." : "적절한 희(喜) 감정은 심신의 이완을 돕지만, 과도해지지 않도록 주의가 필요합니다.";
        case 'ANGER': return group === 'risk' ? "심한 노(怒)는 기를 위로 치밀어 오르게 하여 간을 상하게 하고 두통이나 소화불량을 야기할 수 있습니다." : "스트레스에 대한 분노 반응이 관찰됩니다. 심호흡과 명상으로 화기를 아래로 내려주는 것이 좋습니다.";
        case 'THOUGHT': return group === 'risk' ? "지나친 사(思)는 기를 뭉치게 하여 비장을 상하게 하며, 수면 장애와 식욕 부진을 유발합니다." : "생각이 많은 상태입니다. 신체 활동을 늘려 머리쪽으로 집중된 기운을 분산시키세요.";
        case 'DEPRESSION': return group === 'risk' ? "깊은 우(憂) 감정은 기를 막히게 하여 폐 기능을 저하시키고 호흡을 얕게 만듭니다." : "우울감이 관찰됩니다. 가벼운 유산소 운동으로 폐활량을 늘리고 기운을 순환시키세요.";
        case 'SORROW': return group === 'risk' ? "극심한 비(悲)는 기를 소모시켜 폐를 상하게 하며 전신의 무기력증을 초래합니다." : "슬픔으로 인해 에너지가 소진되고 있습니다. 충분한 휴식과 따뜻한 차로 몸을 달래주세요.";
        case 'FRIGHT': return group === 'risk' ? "만성적인 공(恐)은 기를 아래로 가라앉혀 신장을 상하게 하고 만성 피로를 유발합니다." : "공포와 불안이 내재되어 있습니다. 작은 목표를 달성하며 자신감을 회복하는 과정이 필요합니다.";
        case 'FEAR': return group === 'risk' ? "갑작스러운 경(驚)은 기를 흐트러뜨려 심장과 담력을 상하게 하며 불안장애로 이어질 수 있습니다." : "자율신경계가 다소 예민해져 있습니다. 안정적인 환경에서 규칙적인 생활을 권장합니다.";
        default: return "";
      }
    }
  }

  let overallInsight = lang === 'en' ? "Your overall emotional balance is well maintained. Please continue your current lifestyle patterns and stress management methods." : "전반적인 감정 균형이 잘 유지되고 있습니다. 현재의 생활 패턴과 스트레스 관리 방식을 유지하십시오."
  if (riskItems.length > 0) {
    overallInsight = lang === 'en' 
      ? `Clinically significant levels (Risk Zone) are currently observed in the ${riskItems.map(i => getSubject(i.name || i.subject)).join(', ')} area(s). As this is highly likely to manifest as physical symptoms (e.g., headaches, indigestion, sleep disorders), professional cognitive restructuring training and proactive stress management are immediately required.`
      : `현재 ${riskItems.map(i => i.name || i.subject).join(', ')} 영역에서 임상적으로 유의미한 수치(위험 범위)가 관찰됩니다. 이는 신체적 증상(두통, 소화불량, 수면장애 등)으로 발현될 가능성이 높으므로 전문적인 인지재구성 훈련 및 적극적인 스트레스 관리가 즉각적으로 요구됩니다.`
  } else if (cautionItems.length > 0) {
    overallInsight = lang === 'en'
      ? `The ${cautionItems.map(i => getSubject(i.name || i.subject)).join(', ')} area(s) remain at a Caution Level. Since potential stressors may have accumulated, preventive measures through sufficient rest and light exercise are recommended.`
      : `${cautionItems.map(i => i.name || i.subject).join(', ')} 영역이 주의 단계에 머물러 있습니다. 잠재적인 스트레스 요인이 누적되어 있을 수 있으므로 충분한 휴식과 가벼운 운동을 통한 예방적 조치가 권장됩니다.`
  }

  const genderStr = reportData.gender === 'male' ? t.typeMale : t.typeFemale
  const typeStr = lang === 'en' ? `${reportData.ageGroup === '50s_plus' ? '50s' : reportData.ageGroup} / ${genderStr}` : `${genderStr} / ${reportData.ageGroup === '50s_plus' ? '50' : reportData.ageGroup.replace('s','')}${t.typeAgeSuffix}`

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-sans text-[#333] relative">
      {/* Language Toggle Button (Floating) */}
      <div className="fixed bottom-8 right-6 md:top-24 md:bottom-auto md:right-12 z-50 print:hidden">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] hover:-translate-y-0.5 border-2 border-gray-200 transition-all text-[#566e63] font-black text-base"
        >
          <Globe size={20} />
          {lang === 'ko' ? 'ENG' : 'KOR'}
        </button>
      </div>

      <header className="px-6 md:px-10 py-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm print:hidden">
        <Link href="/" className="font-extrabold text-xl tracking-tight text-[#4a5c53] flex items-center gap-2">
          <BrainCircuit size={24} />
          MoodB
        </Link>
        <nav className="hidden md:flex gap-10 font-bold text-[11px] text-gray-500 uppercase tracking-widest">
          <Link href="/" className="hover:text-black transition-colors">{t.navHome}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={() => window.print()} className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#566e63] transition-colors">
            <Download size={16} /> {t.btnPdf}
          </button>
          <button onClick={() => router.back()} className="text-sm font-bold bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 flex items-center gap-1 transition-colors">
            <ChevronLeft size={16} /> {t.btnBack}
          </button>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="bg-white rounded-none sm:rounded-[40px] p-6 sm:p-12 md:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 print:shadow-none print:border-none print:p-0">
          
          <div className="border-b-4 border-[#222] pb-8 mb-10 text-center relative mt-10 sm:mt-0">
            <div className="absolute top-[-10px] left-0 bg-[#f0ece5] text-[#566e63] px-3 py-1 font-bold text-[10px] tracking-widest uppercase mb-4 sm:mb-0">
              {t.confidential}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tighter text-[#222] mb-4 mt-12 sm:mt-0">{t.reportTitle}</h1>
            <p className="text-gray-500 font-medium flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="font-serif italic tracking-wider">{t.reportSub}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200">
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><CalendarIcon size={12} /> {t.dateLabel}</div>
                <div className="font-extrabold text-sm text-[#222]">{dateString}</div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><User size={12} /> {t.typeLabel}</div>
                <div className="font-extrabold text-sm text-[#222]">{typeStr}</div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><Activity size={12} /> {t.dbLabel}</div>
                <div className="flex items-center gap-2">
                   <div className="font-extrabold text-sm text-[#222]">{(Number(totalTScore) || 0).toFixed(1)}</div>
                </div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><HeartPulse size={12} /> {t.judgementLabel}</div>
                <div className={`font-extrabold text-sm ${riskItems.length > 0 ? 'text-red-600' : cautionItems.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {riskItems.length > 0 ? t.judgeRisk : cautionItems.length > 0 ? t.judgeCaution : t.judgeNormal}
                </div>
             </div>
          </div>

          <section className="mb-16">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">A</span>
              {t.sectionA}
            </h2>
            <div className="bg-[#fcfaf7] p-6 sm:p-8 rounded-3xl border border-[#e8dcc4] text-justify">
               <p className="text-base sm:text-lg text-[#333] leading-loose font-medium">
                 {overallInsight}
               </p>
               <div className="mt-6 flex flex-wrap gap-2">
                 <span className="text-[11px] font-bold bg-[#e8efe9] text-[#566e63] px-3 py-1.5 rounded-full">{t.tagDB}</span>
                 <span className="text-[11px] font-bold bg-[#e8efe9] text-[#566e63] px-3 py-1.5 rounded-full">{t.tagNorm}</span>
               </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">B</span>
              {t.sectionB}
            </h2>
            <div className="space-y-6">
              {detailScores.map((score, idx) => {
                const isRisk = score.group === 'risk'
                const isCaution = score.group === 'caution'
                
                const scoreValue = score.tScore ?? score.A ?? 0
                const scoreName = score.name ?? score.subject ?? '알 수 없음'
                const finalSubject = getSubject(scoreName)
                const groupLabel = isRisk ? t.riskTag : isCaution ? t.cautionTag : t.normalTag

                let factorKey = score.factor
                if (!factorKey) {
                  if (scoreName.includes('기쁨')) factorKey = 'JOY'
                  else if (scoreName.includes('분노')) factorKey = 'ANGER'
                  else if (scoreName.includes('생각') || scoreName.includes('고민')) factorKey = 'THOUGHT'
                  else if (scoreName.includes('우울') || scoreName.includes('근심')) factorKey = 'DEPRESSION'
                  else if (scoreName.includes('슬픔')) factorKey = 'SORROW'
                  else if (scoreName.includes('놀람')) factorKey = 'FEAR'
                  else if (scoreName.includes('공포') || scoreName.includes('두려움')) factorKey = 'FRIGHT'
                }

                return (
                  <div key={idx} className={`p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row gap-6 border ${isRisk ? 'bg-red-50/50 border-red-200/60' : isCaution ? 'bg-orange-50/50 border-orange-200/60' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="md:w-[28%] flex flex-col justify-center items-center md:border-r border-gray-200/60 md:pr-6">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-black text-gray-400">T-score</span>
                         <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: isRisk ? '#dc2626' : isCaution ? '#d97706' : '#4a5c53' }}>
                            {Number(scoreValue).toFixed(0)}
                         </div>
                      </div>
                      <div className="text-sm font-bold tracking-widest text-[#222] mb-1 uppercase">{finalSubject}</div>
                      <div className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full ${isRisk ? 'bg-red-100 text-red-700' : isCaution ? 'bg-orange-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {groupLabel}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start gap-2 mb-2">
                        <Info size={16} className={`mt-0.5 shrink-0 ${isRisk ? 'text-red-500' : isCaution ? 'text-amber-500' : 'text-[#566e63]'}`} />
                        <h4 className="font-extrabold text-sm sm:text-base text-[#222]">{t.medicalAlert}</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium pl-6">
                        {getMedicalInsight(factorKey, score.group)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

           <section>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">C</span>
              {t.sectionC}
            </h2>
            <div className="bg-[#e8efe9] p-8 md:p-10 rounded-3xl border border-[#d0dfd3] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BrainCircuit size={120} />
               </div>
               <p className="text-lg sm:text-xl text-[#333] leading-loose font-medium break-keep relative z-10">
                 {t.guideText}
               </p>
               <div className="mt-10 flex border-t border-[#d0dfd3] pt-8">
                  <Link href="/" className="bg-[#566e63] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-[#43574d] transition-all flex items-center gap-2">
                     <HeartPulse size={18} /> {lang === 'en' ? 'Return to Home' : '홈으로 돌아가기'}
                  </Link>
               </div>
            </div>
          </section>

          <div className="mt-20 pt-10 border-t border-gray-200 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            {t.footerText}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          header, .fixed { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        }
      `}} />
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#566e63]"></div></div>}>
      <ReportContent />
    </Suspense>
  )
}
