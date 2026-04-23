'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { BrainCircuit, ChevronRight, Download, Activity, HeartPulse, ChevronLeft, Calendar as CalendarIcon, User, Info } from 'lucide-react'
import { FactorResult } from '@/utils/diagnostics'

function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idQuery = searchParams.get('id')

  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<any | null>(null)
  
  useEffect(() => {
    const loadReportData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let foundRecord = null

        if (user) {
          // 회원: DB에서 조회
          let query = supabase.from('csei_results').select('*')
          
          if (idQuery) {
            const rawId = idQuery.replace('csei-', '')
            query = query.eq('id', rawId)
          } else {
            query = query.order('created_at', { ascending: false }).limit(1)
          }
          
          const { data, error } = await query
          if (!error && data && data.length > 0) {
            foundRecord = data[0]
          }
        } else {
          // 비회원: 로컬 스토리지에서 조회
          const localCseiStr = localStorage.getItem('final_csei_results')
          if (localCseiStr) {
            const localCsei = JSON.parse(localCseiStr)
            const resultsArray = Array.isArray(localCsei) ? localCsei : (localCsei.scores ? [localCsei] : [])
            
            if (resultsArray.length > 0) {
              if (idQuery) {
                // local에서는 id가 명확하지 않을 수 있으나 최선을 다해 매칭
                foundRecord = resultsArray.find(r => r.id === idQuery || `csei-${r.id}` === idQuery) || resultsArray[0]
              } else {
                foundRecord = resultsArray[0]
              }
            }
          }
        }

        if (foundRecord) {
          setReportData(foundRecord)
        } else {
          // 데이터 없음
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
        <h2 className="text-2xl font-extrabold text-[#222] mb-2">진단 기록을 찾을 수 없습니다</h2>
        <p className="text-gray-500 mb-8 max-w-sm">검사가 정상적으로 완료되지 않았거나 데이터가 존재하지 않습니다.</p>
        <button onClick={() => router.push('/my-situation')} className="bg-[#566e63] text-white px-8 py-3.5 rounded-full font-bold shadow hover:bg-[#43574d] transition-colors">
          마이페이지로 돌아가기
        </button>
      </div>
    )
  }

  // 데이터 파싱 (버전 호환성을 위해 A/subject 와 tScore/name 속성을 모두 지원)
  const scores: any[] = reportData.scores || []
  const detailScores = scores.filter(s => s.factor !== 'TOTAL' && s.subject !== '총합')
  const riskItems = detailScores.filter(s => s.group === 'risk')
  const cautionItems = detailScores.filter(s => s.group === 'caution')
  
  const totalTScore = reportData.overallTScore || reportData.overall_t_score || 0
  
  const createdDate = new Date(reportData.created_at || reportData.timestamp || Date.now())
  const dateString = createdDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  // 의학적 가이드라인 렌더링 헬퍼
  const getMedicalInsight = (factor: string, group: string) => {
    switch (factor) {
      case 'JOY':
        return group === 'risk' ? "과도한 희(喜) 감정은 기(氣)를 느슨하게 하여 심장에 무리를 주고 산만함을 유발할 수 있습니다." : "적절한 희(喜) 감정은 심신의 이완을 돕지만, 과도해지지 않도록 주의가 필요합니다.";
      case 'ANGER':
        return group === 'risk' ? "심한 노(怒)는 기를 위로 치밀어 오르게 하여 간을 상하게 하고 두통이나 소화불량을 야기할 수 있습니다." : "스트레스에 대한 분노 반응이 관찰됩니다. 심호흡과 명상으로 화기를 아래로 내려주는 것이 좋습니다.";
      case 'THOUGHT':
        return group === 'risk' ? "지나친 사(思)는 기를 뭉치게 하여 비장을 상하게 하며, 수면 장애와 식욕 부진을 유발합니다." : "생각이 많은 상태입니다. 신체 활동을 늘려 머리쪽으로 집중된 기운을 분산시키세요.";
      case 'DEPRESSION':
        return group === 'risk' ? "깊은 우(憂) 감정은 기를 막히게 하여 폐 기능을 저하시키고 호흡을 얕게 만듭니다." : "우울감이 관찰됩니다. 가벼운 유산소 운동으로 폐활량을 늘리고 기운을 순환시키세요.";
      case 'SORROW':
        return group === 'risk' ? "극심한 비(悲)는 기를 소모시켜 폐를 상하게 하며 전신의 무기력증을 초래합니다." : "슬픔으로 인해 에너지가 소진되고 있습니다. 충분한 휴식과 따뜻한 차로 몸을 달래주세요.";
      case 'FRIGHT':
        return group === 'risk' ? "갑작스러운 경(驚)은 기를 흐트러뜨려 심장과 담력을 상하게 하며 불안장애로 이어질 수 있습니다." : "자율신경계가 다소 예민해져 있습니다. 안정적인 환경에서 규칙적인 생활을 권장합니다.";
      case 'FEAR':
        return group === 'risk' ? "만성적인 공(恐)은 기를 아래로 가라앉혀 신장을 상하게 하고 만성 피로를 유발합니다." : "두려움과 불안이 내재되어 있습니다. 작은 목표를 달성하며 자신감을 회복하는 과정이 필요합니다.";
      default:
        return "";
    }
  }

  let overallInsight = "전반적인 감정 균형이 잘 유지되고 있습니다. 현재의 생활 패턴과 스트레스 관리 방식을 유지하십시오."
  if (riskItems.length > 0) {
    overallInsight = `현재 ${riskItems.map(i => i.name || i.subject).join(', ')} 영역에서 임상적으로 유의미한 수치(위험 범위)가 관찰됩니다. 이는 신체적 증상(두통, 소화불량, 수면장애 등)으로 발현될 가능성이 높으므로 전문적인 인지재구성 훈련 및 적극적인 스트레스 관리가 즉각적으로 요구됩니다.`
  } else if (cautionItems.length > 0) {
    overallInsight = `${cautionItems.map(i => i.name || i.subject).join(', ')} 영역이 주의 단계에 머물러 있습니다. 잠재적인 스트레스 요인이 누적되어 있을 수 있으므로 충분한 휴식과 가벼운 운동을 통한 예방적 조치가 권장됩니다.`
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-sans text-[#333]">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="px-6 md:px-10 py-6 flex justify-between items-center bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
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
        <div className="flex items-center gap-4">
          <button onClick={() => window.print()} className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#566e63] transition-colors">
            <Download size={16} /> PDF 저장
          </button>
          <button onClick={() => router.back()} className="text-sm font-bold bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 flex items-center gap-1 transition-colors">
            <ChevronLeft size={16} /> 뒤로
          </button>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="bg-white rounded-none sm:rounded-[40px] p-6 sm:p-12 md:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 print:shadow-none print:border-none print:p-0">
          
          {/* HEADER SECTION (Paper/Chart style) */}
          <div className="border-b-4 border-[#222] pb-8 mb-10 text-center relative mt-10 sm:mt-0">
            <div className="absolute top-0 left-0 bg-[#f0ece5] text-[#566e63] px-3 py-1 font-bold text-[10px] tracking-widest uppercase mb-4 sm:mb-0">
              CONFIDENTIAL
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tighter text-[#222] mb-4 mt-8 sm:mt-0">심리 진단 심층 리포트</h1>
            <p className="text-gray-500 font-medium flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="font-serif italic tracking-wider">Clinical Seven Emotions Evaluation Report</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200">
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><CalendarIcon size={12} /> 진단 일자</div>
                <div className="font-extrabold text-sm text-[#222]">{dateString}</div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><User size={12} /> 진단 구분</div>
                <div className="font-extrabold text-sm text-[#222]">{reportData.gender === 'male' ? '남성' : '여성'} / {reportData.ageGroup}대</div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><Activity size={12} /> 종합 T-점수 (전체)</div>
                <div className="font-extrabold text-sm text-[#222]">{(Number(totalTScore) || 0).toFixed(1)} 점</div>
             </div>
             <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs font-bold uppercase"><HeartPulse size={12} /> 종합 판정</div>
                <div className={`font-extrabold text-sm ${riskItems.length > 0 ? 'text-red-600' : cautionItems.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {riskItems.length > 0 ? '위험 구간' : cautionItems.length > 0 ? '주의 요망' : '정상 안정'}
                </div>
             </div>
          </div>

          {/* Section A: Overall Clinical Opinion */}
          <section className="mb-16">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">A</span>
              종합 의학 소견
            </h2>
            <div className="bg-[#fcfaf7] p-6 sm:p-8 rounded-3xl border border-[#e8dcc4] text-justify">
               <p className="text-base sm:text-lg text-[#333] leading-loose font-medium">
                 {overallInsight}
               </p>
               <div className="mt-6 flex flex-wrap gap-2">
                 <span className="text-[11px] font-bold bg-[#e8efe9] text-[#566e63] px-3 py-1.5 rounded-full">T-Score 기준 산출</span>
                 <span className="text-[11px] font-bold bg-[#e8efe9] text-[#566e63] px-3 py-1.5 rounded-full">임상 규준 적용완료</span>
               </div>
            </div>
          </section>

          {/* Section B: Detailed Profile */}
          <section className="mb-16">
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">B</span>
              7정(七情) 수치 심층 분석
            </h2>
            <div className="space-y-6">
              {detailScores.map((score, idx) => {
                const isRisk = score.group === 'risk'
                const isCaution = score.group === 'caution'
                
                // 데이터 하위 호환 매핑
                const scoreValue = score.tScore ?? score.A ?? 0
                const scoreName = score.name ?? score.subject ?? '알 수 없음'
                
                let factorKey = score.factor
                if (!factorKey) {
                  if (scoreName.includes('기쁨')) factorKey = 'JOY'
                  else if (scoreName.includes('분노')) factorKey = 'ANGER'
                  else if (scoreName.includes('생각')) factorKey = 'THOUGHT'
                  else if (scoreName.includes('우울')) factorKey = 'DEPRESSION'
                  else if (scoreName.includes('슬픔')) factorKey = 'SORROW'
                  else if (scoreName.includes('놀람')) factorKey = 'FRIGHT'
                  else if (scoreName.includes('두려움')) factorKey = 'FEAR'
                }

                return (
                  <div key={idx} className={`p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row gap-6 border ${isRisk ? 'bg-red-50/50 border-red-200/60' : isCaution ? 'bg-orange-50/50 border-orange-200/60' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="md:w-1/4 flex flex-col justify-center items-center md:border-r border-gray-200/60 md:pr-6">
                      <div className="text-3xl sm:text-4xl font-extrabold mb-1" style={{ color: isRisk ? '#dc2626' : isCaution ? '#d97706' : '#4a5c53' }}>
                         {Number(scoreValue).toFixed(0)} <span className="text-sm font-bold text-gray-400">T</span>
                      </div>
                      <div className="text-sm font-bold tracking-widest text-[#222] mb-1">{scoreName}</div>
                      <div className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full ${isRisk ? 'bg-red-100 text-red-700' : isCaution ? 'bg-orange-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {score.groupLabel}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start gap-2 mb-2">
                        <Info size={16} className={`mt-0.5 shrink-0 ${isRisk ? 'text-red-500' : isCaution ? 'text-amber-500' : 'text-[#566e63]'}`} />
                        <h4 className="font-extrabold text-sm sm:text-base text-[#222]">유의 사항 및 신체 증상</h4>
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

          {/* Section C: Recommendations */}
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold mb-6 border-b border-gray-200 pb-3">
              <span className="bg-[#4a5c53] text-white w-8 h-8 flex items-center justify-center rounded-full text-sm">C</span>
              권장 가이드라인
            </h2>
            <div className="bg-[#e8efe9] p-6 sm:p-8 rounded-3xl border border-[#d0dfd3]">
              <ul className="space-y-4">
                {riskItems.length > 0 ? (
                  <>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>인지재구성 훈련 필수:</strong> 즉각적으로 상황을 다르게 보는 시각 교정 훈련이 요구됩니다. 우측 상단의 '인지재구성(Cure)' 메뉴를 활용하십시오.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>전문의 상담 검토:</strong> 단기간 내 감정 수치가 안정되지 않을 경우 심리 상담 센터 혹은 관련 전문의 방문을 권장합니다.</span>
                    </li>
                  </>
                ) : cautionItems.length > 0 ? (
                  <>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>예방적 심리 안정:</strong> 스트레스 유발 환경에서 잠시 벗어나 명상이나 호흡법을 실천해 보세요.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>자가 점검 강화:</strong> 향후 1주일 뒤 재검사를 통해 주의 감정이 위험 단계로 넘어가지 않았는지 확인하시기 바랍니다.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>현상 유지:</strong> 이상적인 감정 마인드셋을 잘 유지하고 있습니다. 현재의 루틴을 변동 없이 지속해 주십시오.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#566e63] mt-2.5 shrink-0" />
                      <span className="text-base text-[#333] font-medium leading-relaxed"><strong>정기 점검:</strong> 1개월 단위의 정기적인 검사를 통해 예방적 심신 관리를 지속하시길 바랍니다.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </section>

          <div className="mt-20 pt-10 border-t border-gray-200 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            — FINAL SERVICE CONFIDENTIAL REPORT —
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          header { display: none !important; }
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
