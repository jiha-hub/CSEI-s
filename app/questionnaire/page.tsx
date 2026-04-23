'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  ArrowRight,
  Clock,
  ShieldCheck,
  ClipboardList,
  ChevronLeft,
  Globe
} from 'lucide-react'
import { analyzeResults, Gender, AgeGroup } from '@/utils/diagnostics'
import Navbar from '../components/Navbar'

const QUESTIONS = {
  ko: [
    "내게 좋은 일이 생길 것 같다.", "나는 주변 사람들에게 화를 잘 낸다.", "나는 생각이 많다.",
    "나는 아무 일도 하고 싶은 의욕이 없다.", "나는 서글플 때가 있다.", "나는 간이 작은 것 같다.",
    "나는 깜짝깜짝 놀랜다.", "나는 기분이 들뜬다.", "나는 다른 사람보다 화를 자주 낸다.",
    "나는 고민거리가 많다.", "내 미래는 어두울 것 같다.", "나는 구슬플 때가 있다.",
    "나는 쉽게 당황한다.", "나는 잘 놀랜다.", "나는 활기차다.", "나도 모르게 불끈 성을 낸다.",
    "나는 걱정을 많이 한다.", "나는 만사가 귀찮다.", "나는 슬플 때가 있다.",
    "나는 낯선 사람이 두렵다.", "나는 놀라서 소스라치곤 한다.", "내 삶은 만족스럽다.",
    "내 주변에는 나를 화나게 하는 게 많다.", "나는 반복적으로 떠오르는 생각을 지우기가 어렵다.",
    "내 미래는 희망이 없을 것 같다.", "나는 외롭다.", "나는 여러 사람 앞에 나가 이야기하는 것이 어렵다.",
    "나는 작은 소리에도 잘 놀란다.",
  ],
  en: [
    "I feel like good things will happen to me.", "I often get angry with people around me.", "I have many thoughts.",
    "I have no motivation to do anything.", "I feel melancholy sometimes.", "I feel like I am cowardly.",
    "I get startled easily.", "I feel excited.", "I get angry more often than others.",
    "I have many worries.", "I feel like my future is dark.", "I feel sorrowful sometimes.",
    "I get flustered easily.", "I get surprised easily.", "I am energetic.", "I get angry without realizing it.",
    "I have so many things to worry about.", "I find everything bothersome.", "I feel sad sometimes.",
    "I am afraid of strangers.", "I am often startled in surprise.", "I am satisfied with my life.",
    "There are many things around me that make me angry.", "I find it hard to get rid of recurring thoughts.",
    "I feel like there is no hope for my future.", "I feel lonely.", "I find it difficult to speak in front of many people.",
    "I get startled by small noises.",
  ]
}

const TEXTS = {
  ko: {
    alertGenderAge: '성별과 연령대를 선택해 주세요.',
    alertAnswer: '답변을 선택해 주세요.',
    titleTop: '핵심칠정척도',
    titleMid: '(CSEI-s)',
    titleBot: '기반 임상 진단',
    desc: '한의학의 칠정(희, 노, 우, 사, 비, 공, 경) 증상을 바탕으로\n현대인의 감정 상태를 다각도로 평가하는 표준화된 도구입니다.',
    startAssessment: '진단 시작하기',
    desc2: '약 3분 정도 소요되며, 모든 답변은\n익명으로 철저하게 보호됩니다.',
    btnStart: '검사 시작하기',
    basicTitle: '기본 정보 입력',
    basicDesc: '정교한 분석을 위해 성별과 연령대를 선택해 주세요.',
    genderLabel: 'GENDER',
    genderMale: '남성',
    genderFemale: '여성',
    ageGroupLabel: 'AGE GROUP',
    age50sOver: '50대 이상',
    btnInnerDiag: '내면 진단 시작',
    btnPrev: '이전으로',
    progressStr: 'PROGRESS',
    btnPrevQ: '이전 문항으로',
    timeLimit: '3 MINS',
    privacy: 'PRIVACY GUARANTEED',
    scale5: '정말 그렇다',
    scale4: '자주 그렇다',
    scale3: '보통이다',
    scale2: '가끔 그렇다',
    scale1: '그렇지 않다',
  },
  en: {
    alertGenderAge: 'Please select your gender and age group.',
    alertAnswer: 'Please choose an answer.',
    titleTop: 'The Core Seven-Emotions',
    titleMid: 'Inventory-Short Form',
    titleBot: '(CSEI-s)',
    desc: 'A standardized clinical diagnostic tool that evaluates your emotional state\nfrom multiple angles based on the Seven Emotions in Korean medicine.',
    startAssessment: 'Start Assessment',
    desc2: 'It takes about 3 minutes, and all answers\nare strictly anonymous and protected.',
    btnStart: 'Start Test',
    basicTitle: 'Basic Information',
    basicDesc: 'Please select your gender and age group for accurate analysis.',
    genderLabel: 'GENDER',
    genderMale: 'Male',
    genderFemale: 'Female',
    ageGroupLabel: 'AGE GROUP',
    age50sOver: '50s & over',
    btnInnerDiag: 'Start Inner Diagnosis',
    btnPrev: 'Previous',
    progressStr: 'PROGRESS',
    btnPrevQ: 'Previous Question',
    timeLimit: '3 MINS',
    privacy: 'PRIVACY GUARANTEED',
    scale5: 'Very much like that',
    scale4: 'Quite a bit',
    scale3: 'Somewhat',
    scale2: 'A little',
    scale1: 'Not at all',
  }
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#faf8f5]"><div className="animate-spin w-10 h-10 border-4 border-[#bfa588] border-t-transparent rounded-full" /></div>}>
      <QuestionnaireContent />
    </Suspense>
  )
}

function QuestionnaireContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const emotionParam = searchParams.get('emotion')

  const [lang, setLang] = useState<'ko' | 'en'>('ko')
  const [currentStep, setCurrentStep] = useState(-2)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [gender, setGender] = useState<Gender | ''>('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  const t = TEXTS[lang]

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('gender, birthdate').eq('id', user.id).single()
          if (profile) {
            if (profile.gender) setGender(profile.gender as Gender)
            if (profile.birthdate) {
              const age = new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
              if (age < 30) setAgeGroup('20s'); else if (age < 40) setAgeGroup('30s'); else if (age < 50) setAgeGroup('40s'); else setAgeGroup('50s_plus')
              setAutoFilled(true)
            }
          }
        }
      } catch (e) {}
    }
    loadProfile()
  }, [])

  const handleNext = (manualAnswer?: number) => {
    if (currentStep === -2) { setCurrentStep(-1) }
    else if (currentStep === -1) {
      if (!gender || !ageGroup) { alert(t.alertGenderAge); return }
      setCurrentStep(0)
    } else {
      if (manualAnswer === undefined && !answers[currentStep]) { alert(t.alertAnswer); return }
      if (currentStep < QUESTIONS[lang].length - 1) { setCurrentStep(prev => prev + 1) }
      else { setIsSubmitting(true); handleComplete(manualAnswer) }
    }
  }

  const handlePrev = () => {
    if (currentStep > -2) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async (finalAnswer?: number) => {
    const finalAnswers = { ...answers, ...(finalAnswer !== undefined ? { [currentStep]: finalAnswer } : {}) }
    const { factors, overall } = analyzeResults(finalAnswers, gender as Gender, ageGroup as AgeGroup)
    
    const dbScores = factors.map(f => ({
      subject: f.name, A: f.tScore, fullMark: 100, group: f.group, groupLabel: f.groupLabel, rawScore: f.rawScore
    }))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('csei_results').insert([{
        user_id: user.id, gender, age_group: ageGroup, scores: dbScores, overall_t_score: overall.tScore, overall_group: overall.group, created_at: new Date().toISOString()
      }])
    }

    const stored = localStorage.getItem('final_csei_results')
    const existing = stored ? JSON.parse(stored) : []
    
    let relatedPreTimestamp = undefined
    if (mode === 'post') {
      const lastPre = existing.find((r: any) => !r.isPostMeditation)
      if (lastPre) relatedPreTimestamp = lastPre.timestamp
    }

    const resultData = {
      timestamp: new Date().toISOString(), gender, ageGroup, scores: dbScores, overallTScore: overall.tScore, overallGroup: overall.group,
      ...(mode === 'post' ? { isPostMeditation: true, relatedEmotion: emotionParam, relatedPreTimestamp } : {})
    }
    localStorage.setItem('final_csei_results', JSON.stringify([resultData, ...existing]))
    localStorage.removeItem('moodb_draft')
    router.push(mode === 'post' ? '/result?isPost=true' : '/result')
  }

  const progress = currentStep < 0 ? 0 : ((currentStep + 1) / QUESTIONS[lang].length) * 100

  const toggleLanguage = () => {
    setLang(prev => prev === 'ko' ? 'en' : 'ko')
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col relative">
      <Navbar />

      {/* Language Toggle Button */}
      <div className="absolute top-24 right-6 md:right-12 z-50">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 border-2 border-gray-200 transition-all text-[#566e63] font-black text-base"
        >
          <Globe size={20} />
          {lang === 'ko' ? 'ENG' : 'KOR'}
        </button>
      </div>

      <main className="flex-1 max-w-[900px] mx-auto w-full px-6 py-12 flex flex-col justify-center">
        {currentStep === -2 ? (
          <div className="text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8">
               <h1 className="text-3xl sm:text-5xl font-black text-[#566e63] tracking-tighter leading-tight mb-4">
                 {t.titleTop}<br/>{t.titleMid}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#566e63] to-[#bfa588]">{t.titleBot}</span>
               </h1>
               <p className="text-[#8c7b68] text-base font-medium mb-8" style={{ whiteSpace: 'pre-wrap' }}>
                 {t.desc}
               </p>
            </div>
            
            <div className="bg-white rounded-[40px] p-6 md:p-10 shadow-xl border border-[#e8e0d5] mb-6">
               <div className="w-16 h-16 bg-[#566e63] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#566e63]/20">
                  <ClipboardList size={32} className="text-white" />
               </div>
               <h2 className="text-xl font-black text-[#222] mb-3">{t.startAssessment}</h2>
               <p className="text-gray-500 text-sm font-medium mb-8 max-w-sm mx-auto" style={{ whiteSpace: 'pre-wrap' }}>
                 {t.desc2}
               </p>
               <button 
                 onClick={() => handleNext()}
                 className="w-full max-w-[320px] bg-[#566e63] text-white py-4 rounded-[24px] font-black text-base shadow-xl shadow-[#566e63]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
               >
                 {t.btnStart} <ArrowRight size={20} />
               </button>
            </div>

            <div className="flex justify-center gap-8 text-gray-400 font-bold text-xs uppercase tracking-widest mb-10">
               <div className="flex items-center gap-2"><Clock size={16}/> {t.timeLimit}</div>
               <div className="flex items-center gap-2"><ShieldCheck size={16}/> {t.privacy}</div>
            </div>

            <Link href="/" className="text-[#566e63] font-bold text-sm hover:underline">
               ← 홈으로 돌아가기
            </Link>
          </div>
        ) : currentStep === -1 ? (
          <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-[#222] mb-2">{t.basicTitle}</h2>
            <p className="text-gray-500 mb-6 font-medium text-sm md:text-base">{t.basicDesc}</p>
            
            <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-[#e8e0d5] text-left">
              <div className="mb-6">
                <label className="text-[10px] font-black text-[#bfa588] tracking-widest mb-3 block">{t.genderLabel}</label>
                <div className="flex gap-3">
                  {([['male', t.genderMale], ['female', t.genderFemale]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setGender(val as Gender)} className={`flex-1 py-3 md:py-4 rounded-3xl font-black transition-all ${gender === val ? 'bg-[#566e63] text-white shadow-lg' : 'bg-[#faf8f5] text-gray-400 border border-gray-100 hover:bg-[#f5f0e8]'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <label className="text-[10px] font-black text-[#bfa588] tracking-widest mb-3 block">{t.ageGroupLabel}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['20s', '30s', '40s', '50s_plus'] as const).map(val => {
                    let displayVal = val;
                    if (val === '50s_plus') {
                      displayVal = t.age50sOver;
                    } else if (lang === 'ko') {
                      displayVal = val.replace('s', '대');
                    }
                    return (
                      <button key={val} onClick={() => setAgeGroup(val as AgeGroup)} className={`py-3 md:py-4 rounded-3xl font-black transition-all ${ageGroup === val ? 'bg-[#566e63] text-white shadow-lg' : 'bg-[#faf8f5] text-gray-400 border border-gray-100 hover:bg-[#f5f0e8]'}`}>{displayVal}</button>
                    )
                  })}
                </div>
              </div>
              <button onClick={() => handleNext()} className="w-full py-4 bg-[#566e63] text-white rounded-3xl font-black text-base md:text-lg shadow-lg hover:bg-[#4a5c53]">{t.btnInnerDiag}</button>
            </div>
            <button onClick={() => setCurrentStep(-2)} className="mt-6 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:text-gray-600"><ChevronLeft size={16}/> {t.btnPrev}</button>
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8 md:mb-10">
               <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-black text-[#566e63] tracking-widest">{t.progressStr}: {Math.round(progress)}%</span>
                  <span className="text-sm font-black text-gray-400">{currentStep + 1} / {QUESTIONS[lang].length}</span>
               </div>
               <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#566e63] transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
               </div>
            </div>

            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
               <h3 className="text-xl md:text-3xl font-bold text-[#222] mb-8 md:mb-12 leading-tight break-keep">{QUESTIONS[lang][currentStep]}</h3>
               <div className="grid gap-3 max-w-sm mx-auto">
                 {[5, 4, 3, 2, 1].map((val) => {
                   let scaleText = ''
                   if (val === 5) scaleText = t.scale5;
                   else if (val === 4) scaleText = t.scale4;
                   else if (val === 3) scaleText = t.scale3;
                   else if (val === 2) scaleText = t.scale2;
                   else if (val === 1) scaleText = t.scale1;
                   return (
                     <button 
                       key={val} 
                       onClick={() => handleAnswerChange(val)}
                       className={`w-full py-3 md:py-4 rounded-[20px] font-black text-base md:text-lg transition-all ${answers[currentStep] === val ? 'bg-[#566e63] text-white shadow-xl scale-105' : 'bg-white border border-gray-100 text-gray-500 hover:border-[#566e63] hover:text-[#566e63]'}`}
                     >
                       {scaleText}
                     </button>
                   )
                 })}
               </div>
            </div>
            <button onClick={handlePrev} className="mt-10 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 mx-auto hover:text-gray-600"><ChevronLeft size={16}/> {t.btnPrevQ}</button>
          </div>
        )}
      </main>
    </div>
  )

  function handleAnswerChange(val: number) {
    setAnswers(prev => ({ ...prev, [currentStep]: val }))
    setTimeout(() => handleNext(val), 300)
  }
}
